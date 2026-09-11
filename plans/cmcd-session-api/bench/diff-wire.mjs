// Runs one deterministic workload through two builds of the session API and compares every wire string.
// usage: node diff-wire.mjs <libs/cmcd/dist/index.js of build A> <the same file of build B>
// Timestamps that come from the clock are normalized before the comparison. Exit status 1 on any other difference.
import console from 'node:console'
import { resolve } from 'node:path'
import process from 'node:process'
import { setImmediate } from 'node:timers'
import { pathToFileURL } from 'node:url'

const [distA, distB] = process.argv.slice(2).map(path => resolve(path))

async function run(distPath) {
	const cmcd = await import(pathToFileURL(distPath).href)
	const wire = []
	const requester = async (request) => {
		wire.push(`POST ${request.url}\n${request.body}`)
		return { status: 200 }
	}
	const CDN = 'https://cdn.example.com/v/1080p'
	const legacy = data => (data.e === 'b' && !('bg' in data) ? { ...data, bg: false } : data)
	const dropManifests = (data, request) => (request?.url.includes('manifest') ? null : data)
	const redact = data => ({ ...data, cid: undefined, 'com.example-tag': 'redacted', ec: [], sta: '' })

	for (const [version, transmissionMode, requestTransform, keys] of [
		[2, 'query', undefined, undefined],
		[2, 'headers', dropManifests, ['br', 'bl', 'd', 'ot', 'sid', 'cid', 'mtp', 'nor', 'sn', 'v', 'tb', 'ab', 'su', 'dl', 'com.example-tag']],
		[1, 'query', redact, ['br', 'bl', 'd', 'ot', 'sid', 'cid', 'mtp', 'nor', 'nrr', 'sn', 'v', 'tb', 'su', 'dl']],
		[1, 'headers', undefined, undefined],
	]) {
		const session = cmcd.createCmcdSession({
			sid: `sid-${version}-${transmissionMode}`,
			version,
			transmissionMode,
			keys,
			transform: requestTransform,
			requester,
			eventTargets: [
				{ url: 'https://a.example.com/cmcd', events: ['ps', 'pr', 'c', 'b', 'bc', 'e', 'rr', 'h', 'ce', 'sk', 'as', 'ae', 'abs', 'abe', 'm', 'um', 'pe', 'pc'], interval: 0, batchSize: 3 },
				{ url: 'https://b.example.com/cmcd', events: ['ps', 'e', 'rr', 'bc'], keys: ['sta', 'sid', 'cid', 'e', 'ts', 'sn', 'url', 'rc', 'ttfb', 'ttlb', 'bsd', 'bs', 'ec', 'br', 'pr', 'v'], interval: 0, batchSize: 1, transform: redact },
				{ url: 'https://c.example.com/cmcd', events: ['ps', 'rr', 'b', 'e'], interval: 0, batchSize: 2, transform: legacy },
			],
		})
		const primary = session.createReporter({ cid: 'movie-42' })
		let ts = 1764752370000
		const tick = () => (ts += 250)
		primary.update({ sf: 'd', st: 'v', sta: 's', bl: 0, mtp: 15000, pr: 1, ts: tick() })
		const requests = []
		for (let i = 0; i < 40; i++) {
			const data = i % 7 === 0
				? { ot: 'm', d: 0, br: { v: 3000 + i, a: 128 }, ab: { v: 3200 }, nor: { url: `${CDN}/manifest.mpd`, range: '0-99' } }
				: { ot: i % 5 === 0 ? 'a' : 'v', d: 4004 + i, br: { v: 3000 + i, a: 128 }, tb: { v: 6000, a: 300 }, tpb: { v: 5000 }, nor: [`${CDN}/seg-${i + 1}.m4s`, { url: `${CDN}/seg-${i + 2}.m4s`, range: '100-200' }], 'com.example-tag': `t${i}`, pr: i % 9 === 0 ? 1 : 1.5 }
			const req = primary.decorate({ url: i % 7 === 0 ? `${CDN}/manifest.mpd?x=1#frag` : `${CDN}/seg-${i}.m4s`, headers: { range: 'bytes=0-9' } }, data)
			requests.push(req)
			if (i === 2) {
				primary.update({ sta: 'p', bl: 4000, ts: tick() })
			}
			if (i % 4 === 3) {
				primary.recordResponse(req, { status: i % 8 === 7 ? 404 : 200, headers: { 'CMSD-Static': 'ot=v', 'content-type': 'video/mp4' }, timing: { startTime: 10 + i, responseStart: 40 + i, responseEnd: 90 + i, duration: 80 } })
			}
			if (i % 6 === 5) {
				primary.update({ sta: 'r', bl: 0, ts: tick() })
				primary.update({ sta: 'p', bl: 3000, ts: tick() })
			}
			if (i % 10 === 9) {
				primary.recordError(['MEDIA_ERR_NETWORK', `E${i}`], { ts: tick() })
				primary.recordEvent('ce', { cen: 'quartile', 'com.example-q': 'q3', ts: tick() })
				primary.update({ bg: true, ts: tick() })
				primary.update({ bg: false, ts: tick() })
			}
			if (i === 20) {
				const ad = session.createReporter({ cid: 'ad-7' })
				primary.update({ nr: true, ts: tick() })
				ad.update({ sta: 'p', br: { v: 1000 }, ts: tick() })
				ad.recordEvent('as', { ts: tick() })
				requests.push(ad.decorate({ url: `https://ads.example.com/ad-1.m4s` }, { ot: 'v', d: 2000 }))
				ad.recordEvent('ae', { ts: tick() })
				ad.dispose()
				primary.update({ nr: false, cid: 'movie-43', ts: tick() })
			}
			if (i === 30) {
				session.configure({ keys: ['br', 'bl', 'sid', 'sn', 'v', 'ot', 'd'] })
				session.rotate(`sid-rotated-${version}-${transmissionMode}`)
				primary.update({ sta: 'p', pr: 2, ts: tick() })
			}
		}
		primary.recordResponse(requests[0], { status: 200, timing: { startTime: 1, responseStart: 2, responseEnd: 3 } })
		session.dispose()
		await new Promise(done => setImmediate(done))
		await new Promise(done => setImmediate(done))
		for (const req of requests) {
			wire.push(`REQ ${req.url} ${JSON.stringify(req.headers ?? null)} ${JSON.stringify(req.cmcd.data)}`)
		}
	}
	return wire
}

// `h` events and response reports read the clock, so their `ts` values differ between runs.
const stable = wire => wire.map(line => line.replace(/ts=\d+/g, 'ts=T'))
const [a, b] = [stable(await run(distA)), stable(await run(distB))]
let mismatches = 0
for (let i = 0; i < Math.max(a.length, b.length); i++) {
	if (a[i] !== b[i]) {
		mismatches += 1
		if (mismatches <= 5) {
			console.log(`mismatch at ${i}\n  A: ${a[i]}\n  B: ${b[i]}`)
		}
	}
}
console.log(`${a.length} wire strings from A, ${b.length} from B, ${mismatches} mismatches`)
process.exit(mismatches === 0 && a.length === b.length ? 0 : 1)
