/**
 * Benchmark for the phase-one prototype. Run from the repository root after `npm run build -w libs/xml`:
 *
 *   node plans/xml-incremental-parser/prototype/bench.ts            natural GC
 *   node plans/xml-incremental-parser/prototype/bench.ts --gc       full GC before every measured call
 *   node plans/xml-incremental-parser/prototype/bench.ts --only=livesim2
 *
 * Same method as libs/xml/bench/bench.ts: one process per (variant, input), 4 warm-up calls, medians and
 * p95. The pairs at the end run two variants alternating in one process, which is what an application
 * that uses parseXml and one custom builder does, and report each against its isolated median.
 */
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { generateMpd } from '../../../libs/xml/bench/generate.ts'

type ParseFunction = (input: string) => unknown

type Variant = {
	name: string;
	base: number;
	load: () => Promise<ParseFunction>;
}

type Input = {
	name: string;
	make: () => string;
	iterations: number;
}

type Stats = {
	median: number;
	p95: number;
}

const WARM_UP_CALLS = 4
const FIXTURES = resolve(import.meta.dirname, '../../../libs/xml/test/fixtures')

const args = process.argv.slice(2)
const forceGc = args.includes('--gc')
const only = args.find(arg => arg.startsWith('--only='))?.slice('--only='.length)
const run = args.find(arg => arg.startsWith('--run='))?.slice('--run='.length)
const pair = args.find(arg => arg.startsWith('--pair='))?.slice('--pair='.length)

const variants: Variant[] = [
	{ name: 'parseXml (main after #432)', base: 0, load: async () => (await import('@svta/cml-xml')).parseXml },
	{ name: 'parseXml (phase-one scanner)', base: 0, load: async () => (await import('./parseXml.ts')).parseXml },
	{
		name: 'dash.js today: parseXml (main) + processNode',
		base: 2,
		load: async () => {
			const { parseXml } = await import('@svta/cml-xml')
			const { dashToday } = await import('./dash.ts')
			return (input: string) => dashToday(parseXml, input)
		},
	},
	{ name: 'dash.js one pass, faithful builder (identical output)', base: 2, load: async () => (await import('./dash.ts')).dashOnePassFaithful },
	{ name: 'dash.js one pass, lean builder', base: 2, load: async () => (await import('./dash.ts')).dashOnePassLean },
]

const PAIRS: [number, number][] = [[1, 3], [1, 4]]

const inputs: Input[] = [
	{ name: 'pretty />, 100k S', make: () => generateMpd({ pretty: true }), iterations: forceGc ? 20 : 60 },
	{ name: 'minified />, 100k S', make: () => generateMpd({ pretty: false }), iterations: forceGc ? 20 : 60 },
	{ name: 'pretty </S>, 100k S', make: () => generateMpd({ pretty: true, closed: true }), iterations: forceGc ? 20 : 60 },
	{ name: 'livesim2 real, 5402 S', make: () => readFileSync(resolve(FIXTURES, 'livesim2_tsbd21600.mpd'), 'utf8'), iterations: 300 },
	{ name: 'livesim2-scale 60x2x20 </S>', make: () => generateMpd({ periods: 60, adaptationSets: 2, segments: 20, closed: true }), iterations: 300 },
	{ name: 'bbb_30fps.mpd', make: () => readFileSync(resolve(FIXTURES, 'bbb_30fps.mpd'), 'utf8'), iterations: 3000 },
].filter(input => only === undefined || input.name.includes(only))

let sink: unknown = null

function stats(times: number[]): Stats {
	const sorted = [...times].sort((a, b) => a - b)
	return {
		median: sorted[Math.floor(sorted.length / 2)],
		p95: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))],
	}
}

function formatMs(ms: number): string {
	return (ms >= 10 ? ms.toFixed(1) : ms >= 1 ? ms.toFixed(2) : ms.toFixed(3)) + ' ms'
}

function formatDelta(value: number, base: number): string {
	if (value === base) {
		return 'baseline'
	}
	const delta = ((value - base) / base) * 100
	return (delta > 0 ? '+' : '') + delta.toFixed(1) + '%'
}

function collector(): (() => void) | undefined {
	if (!forceGc) {
		return undefined
	}
	const collect = (globalThis as { gc?: () => void }).gc
	if (collect === undefined) {
		throw new Error('--gc requires node --expose-gc')
	}
	return collect
}

/**
 * Worker mode: times the given variants on one input, alternating between them, and prints JSON
 */
async function measure(variantIndexes: number[], input: Input): Promise<void> {
	const collect = collector()
	const parsers = await Promise.all(variantIndexes.map(index => variants[index].load()))
	const text = input.make()
	const times: number[][] = variantIndexes.map(() => [])

	for (let round = 0; round < WARM_UP_CALLS + input.iterations; round++) {
		parsers.forEach((parse, k) => {
			if (collect !== undefined) {
				collect()
			}
			const start = performance.now()
			sink = parse(text)
			const elapsed = performance.now() - start
			if (round >= WARM_UP_CALLS) {
				times[k].push(elapsed)
			}
		})
	}

	console.log(JSON.stringify({ length: text.length, stats: times.map(stats) }))
}

function spawnWorker(flag: string, inputIndex: number): { length: number; stats: Stats[] } {
	const self = resolve(import.meta.filename)
	const nodeArgs = [...(forceGc ? ['--expose-gc'] : []), '--no-warnings', self, flag, `--input=${inputIndex}`, ...args.filter(arg => !arg.startsWith('--run=') && !arg.startsWith('--pair='))]
	const proc = spawnSync(process.execPath, nodeArgs, { encoding: 'utf8' })
	if (proc.status !== 0) {
		throw new Error(proc.stderr)
	}
	const lines = proc.stdout.trim().split('\n')
	return JSON.parse(lines[lines.length - 1])
}

/**
 * Driver mode: one process per (variant, input), then the pairs
 */
function drive(): void {
	console.log(`Node ${process.version}, ${process.arch}, ${forceGc ? 'full GC before each call' : 'natural GC'}, one process per variant and input, ${WARM_UP_CALLS} warm-up calls\n`)

	inputs.forEach((input, inputIndex) => {
		const isolated = variants.map((_, variantIndex) => spawnWorker(`--run=${variantIndex}`, inputIndex))

		console.log(`### ${input.name} (${isolated[0].length.toLocaleString('en-US')} chars, ${input.iterations} iterations)\n`)
		console.log('| Variant | Median | p95 | vs baseline |')
		console.log('| --- | ---: | ---: | ---: |')
		isolated.forEach((result, variantIndex) => {
			const base = isolated[variants[variantIndex].base].stats[0].median
			console.log(`| ${variants[variantIndex].name} | ${formatMs(result.stats[0].median)} | ${formatMs(result.stats[0].p95)} | ${formatDelta(result.stats[0].median, base)} |`)
		})
		console.log('')

		console.log('Two variants alternating in one process, each against its isolated median:\n')
		console.log('| Pair | Variant | Median | vs isolated |')
		console.log('| --- | --- | ---: | ---: |')
		PAIRS.forEach(([a, b], pairIndex) => {
			const result = spawnWorker(`--pair=${a},${b}`, inputIndex)
			const label = `pair ${pairIndex + 1}`
			console.log(`| ${label} | ${variants[a].name} | ${formatMs(result.stats[0].median)} | ${formatDelta(result.stats[0].median, isolated[a].stats[0].median)} |`)
			console.log(`| ${label} | ${variants[b].name} | ${formatMs(result.stats[1].median)} | ${formatDelta(result.stats[1].median, isolated[b].stats[0].median)} |`)
		})
		console.log('')
	})
}

const inputArg = args.find(arg => arg.startsWith('--input='))?.slice('--input='.length)

if (run !== undefined && inputArg !== undefined) {
	await measure([Number(run)], inputs[Number(inputArg)])
}
else if (pair !== undefined && inputArg !== undefined) {
	await measure(pair.split(',').map(Number), inputs[Number(inputArg)])
}
else {
	drive()
}

if (sink === undefined) {
	console.log('unreachable')
}
