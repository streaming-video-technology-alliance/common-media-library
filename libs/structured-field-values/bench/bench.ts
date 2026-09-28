/**
 * Encoder benchmark. Run from libs/structured-field-values after `npm run build`:
 *
 *   npm run bench                          time every input, one process per variant and input
 *   npm run bench -- --baseline=<path>     also measure the encoder exported by another build and report this
 *                                          build against it; a copy of main's dist folder at
 *                                          libs/structured-field-values/temp/dist (ignored by git and
 *                                          lint) can still resolve its @svta/cml-utils import
 *   npm run bench -- --verify              compare the output of this build with the baseline on every bench input
 *                                          and on the structured-field-tests corpus (needs --baseline)
 *   npm run bench -- --only=<text>         only inputs whose name contains the text
 *
 * Each (variant, input) pair runs in its own process, so type feedback gathered for one variant never shapes the
 * code compiled for another. Each process builds the inputs with the SfItem and SfToken classes of its variant,
 * so instanceof checks match. It makes 30 warm-up batches of 1000 calls, then times 50 batches and reports the
 * median and p95 per call. Every result string is flattened with charCodeAt, so rope strings pay their cost in
 * the measurement. The process then collects garbage and counts the heap bytes that 2000 further calls
 * allocate. The semi-space flags keep the collector out of that window, and the table reports any collection
 * that ran anyway.
 */
import { spawnSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { performance, PerformanceObserver } from 'node:perf_hooks'
import { pathToFileURL } from 'node:url'
import base32 from 'hi-base32'
import { type EncoderApi, type Input, makeInputs } from './inputs.ts'

type Variant = {
	name: string;
	load: () => Promise<EncoderApi>;
}

type WorkerResult = {
	median: number;
	p95: number;
	bytesPerCall: number;
	collections: number;
	length: number;
}

const BATCH = 1000
const WARM_UP_BATCHES = 30
const TIMED_BATCHES = 50
const ALLOCATION_CALLS = 2000
const THROWS = 'throws: '
const CORPUS = resolve(import.meta.dirname, '../../../structured-field-tests')

const args = process.argv.slice(2)
const baseline = args.find(arg => arg.startsWith('--baseline='))?.slice('--baseline='.length)
const only = args.find(arg => arg.startsWith('--only='))?.slice('--only='.length)
const run = args.find(arg => arg.startsWith('--run='))?.slice('--run='.length)

const variants: Variant[] = [
	{
		name: 'this build',
		load: async () => await import('@svta/cml-structured-field-values'),
	},
]

if (baseline !== undefined) {
	variants.unshift({
		name: 'baseline',
		load: async () => await import(pathToFileURL(resolve(baseline)).href) as EncoderApi,
	})
}

let sink = 0

function selectInputs(api: EncoderApi): Input[] {
	return makeInputs(api).filter(input => only === undefined || input.name.includes(only))
}

function percentile(times: number[], fraction: number): number {
	const sorted = [...times].sort((a, b) => a - b)
	return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))]
}

function formatDelta(value: number, base: number): string {
	const delta = ((value - base) / base) * 100
	return (delta > 0 ? '+' : '') + delta.toFixed(1) + '%'
}

function sleep(ms: number): Promise<void> {
	return new Promise(done => setTimeout(done, ms))
}

/**
 * Worker mode: times one variant on one input and prints the result as JSON.
 */
async function measure(variantIndex: number, inputIndex: number): Promise<void> {
	if (typeof gc !== 'function') {
		throw new Error('measure needs node --expose-gc')
	}

	const api = await variants[variantIndex].load()
	const { call } = selectInputs(api)[inputIndex]

	const batch = (): void => {
		for (let i = 0; i < BATCH; i++) {
			const output = call()
			sink += output.charCodeAt(output.length >> 1)
		}
	}

	for (let i = 0; i < WARM_UP_BATCHES; i++) {
		batch()
	}

	const times: number[] = []
	for (let i = 0; i < TIMED_BATCHES; i++) {
		const start = performance.now()
		batch()
		times.push((performance.now() - start) * 1e6 / BATCH)
	}

	gc()
	gc()
	await sleep(20)

	let collections = 0
	const observer = new PerformanceObserver(list => {
		collections += list.getEntries().length
	})
	observer.observe({ entryTypes: ['gc'] })

	const before = process.memoryUsage().heapUsed
	for (let i = 0; i < ALLOCATION_CALLS; i++) {
		const output = call()
		sink += output.charCodeAt(output.length >> 1)
	}
	const after = process.memoryUsage().heapUsed

	await sleep(30)
	observer.disconnect()

	const result: WorkerResult = {
		median: percentile(times, 0.5),
		p95: percentile(times, 0.95),
		bytesPerCall: (after - before) / ALLOCATION_CALLS,
		collections,
		length: call().length,
	}
	console.log(JSON.stringify(result))
}

/**
 * Driver mode: spawns one worker process per (variant, input) pair and prints one table.
 */
async function drive(): Promise<void> {
	const self = resolve(import.meta.filename)
	const inputs = selectInputs(await variants[variants.length - 1].load())

	console.log(`Node ${process.version}, ${process.arch}, one process per variant and input, ${WARM_UP_BATCHES} warm-up batches of ${BATCH} calls, ${TIMED_BATCHES} timed batches\n`)

	const results: WorkerResult[][] = inputs.map((_, inputIndex) => variants.map((_, variantIndex) => {
		const nodeArgs = ['--expose-gc', '--min-semi-space-size=64', '--max-semi-space-size=128', '--no-warnings', self, `--run=${variantIndex},${inputIndex}`, ...args]
		const proc = spawnSync(process.execPath, nodeArgs, { encoding: 'utf8' })
		if (proc.status !== 0) {
			throw new Error(proc.stderr)
		}
		const lines = proc.stdout.trim().split('\n')
		return JSON.parse(lines[lines.length - 1])
	}))

	const bytes = (result: WorkerResult): string => result.bytesPerCall.toFixed(0) + (result.collections > 0 ? ` (${result.collections} gc)` : '')

	if (variants.length === 1) {
		console.log('| Input | Output chars | Median ns | p95 ns | Heap bytes per call |')
		console.log('| --- | ---: | ---: | ---: | ---: |')
		inputs.forEach((input, inputIndex) => {
			const [result] = results[inputIndex]
			console.log(`| ${input.name} | ${result.length} | ${result.median.toFixed(0)} | ${result.p95.toFixed(0)} | ${bytes(result)} |`)
		})
		return
	}

	console.log('| Input | Baseline ns, median (p95) | This build ns, median (p95) | Median delta | Baseline bytes per call | This build bytes per call |')
	console.log('| --- | ---: | ---: | ---: | ---: | ---: |')
	inputs.forEach((input, inputIndex) => {
		const [base, current] = results[inputIndex]
		console.log(`| ${input.name} | ${base.median.toFixed(0)} (${base.p95.toFixed(0)}) | ${current.median.toFixed(0)} (${current.p95.toFixed(0)}) | ${formatDelta(current.median, base.median)} | ${bytes(base)} | ${bytes(current)} |`)
	})
}

/**
 * Builds one case per corpus vector that has an expected value, with the classes of the given encoder.
 */
function makeCorpusCases(api: EncoderApi): Input[] {
	const { SfItem } = api

	const format = (value: any): any => {
		if (Array.isArray(value)) {
			return value.map(format)
		}
		switch (value?.__type) {
			case 'binary':
				return Uint8Array.from(value.value === '' ? [] : base32.decode.asBytes(value.value))
			case 'token':
				return Symbol.for(value.value)
			case 'date':
				return new Date(value.value * 1000)
			default:
				return value
		}
	}
	const formatParams = (params: any[]): Record<string, any> | undefined => (params.length === 0 ? undefined : Object.fromEntries(params.map(format)))
	const formatItem = ([value, params]: any[]): any => new SfItem(Array.isArray(value) ? value.map(formatItem) : format(value), formatParams(params))

	const files = [
		...readdirSync(CORPUS).filter(file => file.endsWith('.json')).map(file => resolve(CORPUS, file)),
		...readdirSync(resolve(CORPUS, 'serialisation-tests')).map(file => resolve(CORPUS, 'serialisation-tests', file)),
	]
	const cases: Input[] = []

	for (const file of files) {
		for (const suite of JSON.parse(readFileSync(file, 'utf8'))) {
			if (suite.expected === undefined || JSON.stringify(suite.expected).includes('displaystring')) {
				continue
			}
			const name = `${basename(file)}: ${suite.name}`
			if (suite.header_type === 'item') {
				cases.push({ name, call: () => api.encodeSfItem(formatItem(suite.expected)) })
			}
			else if (suite.header_type === 'list') {
				cases.push({ name, call: () => api.encodeSfList(suite.expected.map(formatItem)) })
			}
			else if (suite.header_type === 'dictionary') {
				cases.push({ name, call: () => api.encodeSfDict(Object.fromEntries(suite.expected.map(([key, entry]: any[]) => [key, formatItem(entry)]))) })
			}
		}
	}

	return cases
}

function outcome(input: Input): string {
	try {
		return input.call()
	}
	catch (error) {
		return THROWS + (error as Error).message
	}
}

/**
 * Verify mode: compares the output of this build with the baseline on the bench inputs and the corpus.
 */
async function verify(): Promise<void> {
	if (variants.length < 2) {
		throw new Error('--verify needs --baseline=<path>')
	}

	const [base, current] = await Promise.all(variants.map(variant => variant.load()))
	const baseCases = [...selectInputs(base), ...makeCorpusCases(base)]
	const currentCases = [...selectInputs(current), ...makeCorpusCases(current)]
	const differences: string[] = []
	let identical = 0
	let messageOnly = 0

	baseCases.forEach((baseCase, index) => {
		const expected = outcome(baseCase)
		const actual = outcome(currentCases[index])
		if (expected === actual) {
			identical++
		}
		else if (expected.startsWith(THROWS) && actual.startsWith(THROWS)) {
			messageOnly++
			differences.push(`error message  ${baseCase.name}\n    baseline:   ${expected}\n    this build: ${actual}`)
		}
		else {
			differences.push(`OUTPUT         ${baseCase.name}\n    baseline:   ${expected}\n    this build: ${actual}`)
		}
	})

	console.log(`${baseCases.length} cases: ${identical} identical, ${messageOnly} differ only in the error message, ${baseCases.length - identical - messageOnly} differ in output`)
	differences.forEach(line => console.log(`  ${line}`))
}

if (run !== undefined) {
	const [variantIndex, inputIndex] = run.split(',').map(Number)
	await measure(variantIndex, inputIndex)
}
else if (args.includes('--verify')) {
	await verify()
}
else {
	await drive()
}

if (sink === Infinity) {
	console.log('unreachable')
}
