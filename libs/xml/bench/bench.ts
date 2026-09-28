/**
 * parseXml benchmark. Run from libs/xml after `npm run build`:
 *
 *   npm run bench                          natural GC, one process per variant and input
 *   npm run bench -- --gc                  full GC before every measured call (fewer iterations on large inputs)
 *   npm run bench -- --baseline=<path>     also measure the parseXml exported by another build and report this
 *                                          build against it; a copy of main's dist folder at libs/xml/temp/dist
 *                                          (ignored by git and lint) can still resolve its @svta/cml-utils import
 *   npm run bench -- --only=<text>         only inputs whose name contains the text
 *
 * Each (variant, input) pair runs in its own process so that type feedback gathered for one variant
 * never shapes the code compiled for another. Each process builds the input, makes 4 warm-up calls,
 * then times each measured call with performance.now() and reports the median and p95. Every result is
 * kept in a variable so nothing is eliminated as dead code.
 */
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { generateMpd } from './generate.ts'

type ParseFunction = (input: string) => unknown

type Variant = {
	name: string;
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

type WorkerResult = {
	length: number;
	stats: Stats;
}

const WARM_UP_CALLS = 4
const FIXTURES = resolve(import.meta.dirname, '../test/fixtures')

const args = process.argv.slice(2)
const forceGc = args.includes('--gc')
const baseline = args.find(arg => arg.startsWith('--baseline='))?.slice('--baseline='.length)
const only = args.find(arg => arg.startsWith('--only='))?.slice('--only='.length)
const run = args.find(arg => arg.startsWith('--run='))?.slice('--run='.length)

const variants: Variant[] = [
	{
		name: 'parseXml (this build)',
		load: async () => (await import('@svta/cml-xml')).parseXml,
	},
]

if (baseline !== undefined) {
	variants.unshift({
		name: `parseXml (${baseline})`,
		load: async () => {
			const module: { parseXml: ParseFunction } = await import(pathToFileURL(resolve(baseline)).href)
			return module.parseXml
		},
	})
}

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

/**
 * Worker mode: times one variant on one input and prints the result as JSON.
 */
async function measure(variant: Variant, input: Input): Promise<void> {
	const collect = forceGc ? gc : undefined
	if (forceGc && collect === undefined) {
		throw new Error('--gc requires node --expose-gc')
	}

	const parse = await variant.load()
	const text = input.make()
	const times: number[] = []

	for (let round = 0; round < WARM_UP_CALLS + input.iterations; round++) {
		if (collect !== undefined) {
			collect()
		}
		const start = performance.now()
		sink = parse(text)
		const elapsed = performance.now() - start
		if (round >= WARM_UP_CALLS) {
			times.push(elapsed)
		}
	}

	const result: WorkerResult = { length: text.length, stats: stats(times) }
	console.log(JSON.stringify(result))
}

/**
 * Driver mode: spawns one worker process per (variant, input) pair and prints a table per input.
 */
function drive(): void {
	const self = resolve(import.meta.filename)

	console.log(`Node ${process.version}, ${process.arch}, ${forceGc ? 'full GC before each call' : 'natural GC'}, one process per variant and input, ${WARM_UP_CALLS} warm-up calls\n`)

	inputs.forEach((input, inputIndex) => {
		const results: WorkerResult[] = variants.map((_, variantIndex) => {
			const nodeArgs = [...(forceGc ? ['--expose-gc'] : []), '--no-warnings', self, `--run=${variantIndex},${inputIndex}`, ...args]
			const proc = spawnSync(process.execPath, nodeArgs, { encoding: 'utf8' })
			if (proc.status !== 0) {
				throw new Error(proc.stderr)
			}
			const lines = proc.stdout.trim().split('\n')
			return JSON.parse(lines[lines.length - 1])
		})

		console.log(`### ${input.name} (${results[0].length.toLocaleString('en-US')} chars, ${input.iterations} iterations)\n`)
		console.log('| Variant | Median | p95 | vs baseline |')
		console.log('| --- | ---: | ---: | ---: |')
		results.forEach((result, variantIndex) => {
			console.log(`| ${variants[variantIndex].name} | ${formatMs(result.stats.median)} | ${formatMs(result.stats.p95)} | ${formatDelta(result.stats.median, results[0].stats.median)} |`)
		})
		console.log('')
	})
}

if (run !== undefined) {
	const [variantIndex, inputIndex] = run.split(',').map(Number)
	await measure(variants[variantIndex], inputs[inputIndex])
}
else {
	drive()
}

if (sink === undefined) {
	console.log('unreachable')
}
