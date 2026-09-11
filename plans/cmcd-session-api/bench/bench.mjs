// Benchmarks one CMCD reporting API from a built @svta/cml-cmcd package.
//
// usage:
//   node --expose-gc --max-semi-space-size=64 bench.mjs --dist <libs/cmcd/dist/index.js> --api <session|reporter> --label <name> [--json <file>] [--check]
//
// Every scenario drives the same player workload through the public API of one implementation.
// The session API receives plain values, and CmcdReporter receives the structured-field values
// its documentation shows. Both produce the same keys on the wire, which `--check` prints.
import console from 'node:console'
import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { PerformanceObserver } from 'node:perf_hooks'
import process from 'node:process'
import { setImmediate, setTimeout } from 'node:timers'
import { pathToFileURL } from 'node:url'

const args = parseArgs(process.argv.slice(2))
const distPath = resolve(args.dist)
const cmcd = await import(pathToFileURL(distPath).href)
// The same structured-field-values instance the package uses, so `instanceof SfItem` holds.
const sfvPath = createRequire(distPath).resolve('@svta/cml-structured-field-values')
const { SfItem } = await import(pathToFileURL(sfvPath).href)

const CDN = 'https://cdn.example.com/v/1080p'
const COLLECTOR = 'https://collector.example.com/cmcd'
const CID = 'movie-42'
const SID = '6e2fb550-c457-45b9-b5a9-4a2c5f0e6b11'
const REQUEST_KEYS = ['br', 'bl', 'd', 'ot', 'sid', 'cid', 'mtp', 'sf', 'st', 'su', 'nor', 'dl', 'pr', 'sn', 'v', 'tb', 'bs', 'pt', 'ltc', 'rtp']
const EVENT_KEYS = ['sta', 'sid', 'cid', 'v', 'e', 'ts', 'sn', 'bl', 'br', 'mtp', 'url', 'rc', 'ttfb', 'ttlb', 'ec', 'pr', 'd', 'ot', 'pt', 'su', 'bs', 'msd', 'dl', 'tb']
const EVENTS = ['ps', 'e', 't', 'rr']
const BATCH_SIZE = 50
const RESPONSE_HEADERS = { 'content-type': 'video/mp4', 'content-length': '2000000' }

let posts = 0
let postBytes = 0
const requester = async (request) => {
	posts += 1
	postBytes += request.body.length
	return { status: 200 }
}

function timing(i) {
	const start = 1000 + i * 4000
	return { startTime: start, responseStart: start + 40, responseEnd: start + 90, duration: 90 }
}

function request(i) {
	return { url: `${CDN}/seg-${i}.m4s`, headers: { range: 'bytes=0-999999' } }
}

// One adapter per API. Each method is one player call.
const adapters = {
	reporter: {
		construct(mode, withEvents) {
			const reporter = new cmcd.CmcdReporter({
				sid: SID,
				cid: CID,
				version: 2,
				transmissionMode: mode,
				enabledKeys: REQUEST_KEYS,
				eventTargets: withEvents ? [{ url: COLLECTOR, events: EVENTS, enabledKeys: EVENT_KEYS, interval: 0, batchSize: BATCH_SIZE }] : [],
			}, requester)
			reporter.start()
			return reporter
		},
		init(r) {
			r.update({ sf: 'd', st: 'v', sta: 's', bl: [0], mtp: [15000], pr: 1 })
			r.update({ sta: 'p', bl: [4000] })
		},
		updateMetrics(r, i) {
			r.update({ bl: [4000 + (i % 7) * 100], mtp: [15000 + (i % 5) * 100], pt: i * 4000 })
		},
		updateSta(r, sta) {
			r.update({ sta })
		},
		decorate(r, i) {
			return r.createRequestReport(request(i), { ot: 'v', d: 4004, br: [new SfItem(3000, { v: true })], tb: [new SfItem(6000, { v: true })], nor: [`${CDN}/seg-${i + 1}.m4s`] })
		},
		respond(r, req, i) {
			r.recordResponseReceived({ request: req, status: 200, headers: RESPONSE_HEADERS, resourceTiming: timing(i) })
		},
		rotate(r, i) {
			r.update({ sid: `${SID}-${i}` })
		},
		flush(r) {
			r.flush()
		},
		dispose(r) {
			r.stop(true)
		},
	},
	session: {
		construct(mode, withEvents) {
			const session = cmcd.createCmcdSession({
				sid: SID,
				version: 2,
				transmissionMode: mode,
				keys: REQUEST_KEYS,
				eventTargets: withEvents ? [{ url: COLLECTOR, events: EVENTS, keys: EVENT_KEYS, interval: 0, batchSize: BATCH_SIZE }] : [],
				requester,
			})
			return { session, reporter: session.createReporter({ cid: CID }) }
		},
		init(h) {
			h.reporter.update({ sf: 'd', st: 'v', sta: 's', bl: 0, mtp: 15000, pr: 1 })
			h.reporter.update({ sta: 'p', bl: 4000 })
		},
		updateMetrics(h, i) {
			h.reporter.update({ bl: 4000 + (i % 7) * 100, mtp: 15000 + (i % 5) * 100, pt: i * 4000 })
		},
		updateSta(h, sta) {
			h.reporter.update({ sta })
		},
		decorate(h, i) {
			return h.reporter.decorate(request(i), { ot: 'v', d: 4004, br: { v: 3000 }, tb: { v: 6000 }, nor: `${CDN}/seg-${i + 1}.m4s` })
		},
		respond(h, req, i) {
			h.reporter.recordResponse(req, { status: 200, headers: RESPONSE_HEADERS, timing: timing(i) })
		},
		rotate(h, i) {
			h.session.rotate(`${SID}-${i}`)
		},
		flush(h) {
			h.session.flush()
		},
		dispose(h) {
			h.session.dispose()
		},
	},
}

const api = adapters[args.api]
if (!api) {
	throw new Error(`unknown --api ${args.api}`)
}

// GC observation for the allocation probe and the GC pressure column.
let gcCount = 0
const observer = new PerformanceObserver(list => {
	gcCount += list.getEntries().length
})
observer.observe({ entryTypes: ['gc'] })

const yieldToLoop = () => new Promise(done => setImmediate(done))

async function settle() {
	await yieldToLoop()
	await yieldToLoop()
}

function quantile(sorted, q) {
	const index = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * q)))
	return sorted[index]
}

/**
 * Times `op` in batches of `k` synchronous calls followed by one turn of the event loop,
 * so the promise settlements of the mock requester are inside the timed region.
 * Returns nanoseconds per operation over the measured batches, plus GC events per 10k ops.
 */
async function timeScenario({ setup, op, prepare }, { k, rounds, warm }) {
	const handle = setup()
	let i = 0
	for (let w = 0; w < warm; w++) {
		prepare?.(handle, i, k)
		for (let n = 0; n < k; n++) {
			op(handle, i++)
		}
		await settle()
	}
	const samples = []
	const gcBefore = gcCount
	for (let r = 0; r < rounds; r++) {
		prepare?.(handle, i, k)
		const t0 = process.hrtime.bigint()
		for (let n = 0; n < k; n++) {
			op(handle, i++)
		}
		await yieldToLoop()
		const t1 = process.hrtime.bigint()
		samples.push(Number(t1 - t0) / k)
	}
	await settle()
	const gcPer10k = ((gcCount - gcBefore) / (rounds * k)) * 10000
	api.dispose(handle)
	await settle()
	samples.sort((a, b) => a - b)
	return { median: quantile(samples, 0.5), p10: quantile(samples, 0.1), p90: quantile(samples, 0.9), gcPer10k, k, rounds }
}

/**
 * Heap bytes allocated per operation: the heap growth over `k` synchronous calls with no
 * garbage collection inside the window. Windows with a collection are discarded.
 */
async function allocScenario({ setup, op, prepare }, { k, rounds, warm }) {
	const handle = setup()
	let i = 0
	for (let w = 0; w < warm; w++) {
		prepare?.(handle, i, k)
		for (let n = 0; n < k; n++) {
			op(handle, i++)
		}
		await settle()
	}
	const samples = []
	let discarded = 0
	for (let r = 0; r < rounds * 2 && samples.length < rounds; r++) {
		prepare?.(handle, i, k)
		globalThis.gc()
		// The observer delivers the entries of the forced collection asynchronously. Wait for them
		// before taking the baseline, so they do not count as a collection inside the window.
		await new Promise(done => setTimeout(done, 5))
		await settle()
		const before = gcCount
		const h0 = process.memoryUsage().heapUsed
		for (let n = 0; n < k; n++) {
			op(handle, i++)
		}
		const h1 = process.memoryUsage().heapUsed
		await settle()
		if (gcCount === before) {
			samples.push((h1 - h0) / k)
		}
		else {
			discarded += 1
		}
	}
	api.dispose(handle)
	await settle()
	samples.sort((a, b) => a - b)
	return { median: samples.length ? quantile(samples, 0.5) : NaN, samples: samples.length, discarded }
}

/** Heap retained after `cycles` segment cycles once the player dropped every request. */
async function retainedScenario(cycles) {
	globalThis.gc()
	await settle()
	const base = process.memoryUsage().heapUsed
	const handle = api.construct('query', true)
	api.init(handle)
	let live = []
	for (let i = 0; i < cycles; i++) {
		api.updateMetrics(handle, i)
		const req = api.decorate(handle, i)
		api.respond(handle, req, i)
		live.push(req)
		if (i % 200 === 199) {
			live = []
			await yieldToLoop()
		}
	}
	live = []
	api.flush(handle)
	await settle()
	globalThis.gc()
	globalThis.gc()
	await settle()
	const retained = process.memoryUsage().heapUsed - base
	api.dispose(handle)
	return retained
}

const scenarios = {
	'construct': {
		setup: () => null,
		op: () => api.dispose(api.construct('query', true)),
		k: 200,
	},
	'update metrics': {
		setup: () => {
			const h = api.construct('query', true)
			api.init(h)
			return h
		},
		op: (h, i) => api.updateMetrics(h, i),
		k: 1000,
	},
	'update sta, play and pause': {
		setup: () => {
			const h = api.construct('query', true)
			api.init(h)
			return h
		},
		op: (h, i) => api.updateSta(h, i % 2 ? 'a' : 'p'),
		k: 500,
	},
	'update sta, stall and recover': {
		setup: () => {
			const h = api.construct('query', true)
			api.init(h)
			return h
		},
		op: (h, i) => api.updateSta(h, i % 2 ? 'p' : 'r'),
		k: 500,
	},
	'decorate, query': {
		setup: () => {
			const h = api.construct('query', true)
			api.init(h)
			return h
		},
		op: (h, i) => api.decorate(h, i),
		k: 500,
	},
	'decorate, headers': {
		setup: () => {
			const h = api.construct('headers', true)
			api.init(h)
			return h
		},
		op: (h, i) => api.decorate(h, i),
		k: 500,
	},
	'record response': {
		setup: () => {
			const h = api.construct('query', true)
			api.init(h)
			return { h, pending: new Map() }
		},
		// The decorations of a batch run before the batch is timed.
		prepare: (s, start, k) => {
			for (let n = 0; n < k; n++) {
				s.pending.set(start + n, api.decorate(s.h, start + n))
			}
		},
		op: (s, i) => {
			const req = s.pending.get(i)
			s.pending.delete(i)
			api.respond(s.h, req, i)
		},
		k: 500,
	},
	'segment cycle, one event target': {
		setup: () => {
			const h = api.construct('query', true)
			api.init(h)
			return h
		},
		op: (h, i) => {
			api.updateMetrics(h, i)
			const req = api.decorate(h, i)
			api.respond(h, req, i)
			if (i % 25 === 24) {
				api.updateSta(h, i % 50 === 24 ? 'a' : 'p')
			}
		},
		k: 300,
	},
	'segment cycle, request mode only': {
		setup: () => {
			const h = api.construct('query', false)
			api.init(h)
			return h
		},
		op: (h, i) => {
			api.updateMetrics(h, i)
			const req = api.decorate(h, i)
			api.respond(h, req, i)
		},
		k: 300,
	},
	'rotate sid': {
		setup: () => {
			const h = api.construct('query', true)
			api.init(h)
			return h
		},
		op: (h, i) => api.rotate(h, i),
		k: 200,
	},
}

// The record-response scenario's setup wraps the handle, so dispose reaches the inner handle.
const disposeOf = api.dispose
api.dispose = handle => {
	if (!handle) {
		return undefined
	}
	if (handle.h) {
		return disposeOf(handle.h)
	}
	return disposeOf(handle)
}

if (args.profile) {
	// Runs one scenario for `--ops` operations without measurement, for `node --cpu-prof`.
	const scenario = scenarios[args.profile]
	if (!scenario) {
		throw new Error(`unknown scenario ${args.profile}`)
	}
	const handle = scenario.setup()
	const ops = Number(args.ops ?? 50000)
	for (let i = 0; i < ops; i++) {
		if (i % scenario.k === 0) {
			scenario.prepare?.(handle, i, scenario.k)
		}
		scenario.op(handle, i)
		if (i % scenario.k === scenario.k - 1) {
			await yieldToLoop()
		}
	}
	await settle()
	api.dispose(handle)
	process.exit(0)
}

if (args.check) {
	const h = api.construct('query', true)
	api.init(h)
	const req = api.decorate(h, 1)
	api.respond(h, req, 1)
	api.updateSta(h, 'r')
	api.updateSta(h, 'p')
	api.flush(h)
	await settle()
	const hh = api.construct('headers', true)
	api.init(hh)
	const req2 = api.decorate(hh, 1)
	api.dispose(h)
	api.dispose(hh)
	await settle()
	console.log(`[${args.label}] decorated url: ${req.url}`)
	console.log(`[${args.label}] decorated headers: ${JSON.stringify(req2.headers)}`)
	console.log(`[${args.label}] posts ${posts}, bytes ${postBytes}`)
	process.exit(0)
}

if (args.retained) {
	// Leak check: the heap retained after N segment cycles, printed in bytes.
	const retained = await retainedScenario(Number(args.retained))
	console.log(`[${args.label}] retained after ${args.retained} cycles: ${retained}`)
	process.exit(0)
}

const rounds = Number(args.rounds ?? 30)
const warm = Number(args.warm ?? 8)
const result = { label: args.label, api: args.api, dist: distPath, node: process.version, scenarios: {} }
for (const [name, scenario] of Object.entries(scenarios)) {
	const time = await timeScenario(scenario, { k: scenario.k, rounds, warm })
	const alloc = await allocScenario(scenario, { k: Math.min(scenario.k, 200), rounds: 12, warm: 2 })
	result.scenarios[name] = { ...time, bytesPerOp: alloc.median, allocSamples: alloc.samples, allocDiscarded: alloc.discarded }
	console.error(`[${args.label}] ${name}: ${(time.median / 1000).toFixed(2)} us/op (p90 ${(time.p90 / 1000).toFixed(2)}), ${Math.round(alloc.median)} B/op, ${time.gcPer10k.toFixed(1)} gc/10k`)
}
result.retainedBytesAfter20kCycles = await retainedScenario(20000)
result.posts = posts
result.postBytes = postBytes
console.error(`[${args.label}] retained after 20k cycles: ${Math.round(result.retainedBytesAfter20kCycles / 1024)} KB`)
if (args.json) {
	writeFileSync(args.json, JSON.stringify(result, null, '\t'))
}

function parseArgs(argv) {
	const out = {}
	for (let i = 0; i < argv.length; i++) {
		const key = argv[i]
		if (!key.startsWith('--')) {
			continue
		}
		const next = argv[i + 1]
		if (next === undefined || next.startsWith('--')) {
			out[key.slice(2)] = true
		}
		else {
			out[key.slice(2)] = next
			i += 1
		}
	}
	return out
}
