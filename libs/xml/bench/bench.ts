/**
 * parseXml benchmark. Run from libs/xml after `npm run build`:
 *
 *   npm run bench                          natural GC, one process per variant and input
 *   npm run bench -- --gc                  full GC before every measured call (fewer iterations on large inputs)
 *   npm run bench -- --baseline=<build>    also measure the parseXml exported by another build and report this
 *                                          build against it
 *   npm run bench -- --build=<build>       measure another build in place of this build
 *   npm run bench -- --runs=<count>        processes per variant and input (default 1, or 5 with --threshold);
 *                                          the table shows the process with the lowest mean
 *   npm run bench -- --threshold=<percent> exit with code 1 if the build is slower than the baseline by more
 *                                          than the threshold on any input; requires --baseline
 *   npm run bench -- --only=<text>         only inputs whose name contains the text
 *
 * The regression check against the latest release is `npm run bench -- --baseline=npm --threshold=15`.
 *
 * A <build> is one of:
 *
 *   <path>           path to a dist/index.js; a copy of main's dist folder at libs/xml/temp/dist (ignored by
 *                    git and lint) can still resolve its @svta/cml-utils import
 *   npm              the latest @svta/cml-xml on npm
 *   npm:<version>    a published version of @svta/cml-xml
 *
 * The script installs an npm build and its @svta/cml-utils peer into a folder in the temporary directory
 * of the system. The script removes the folder at exit.
 *
 * Each (variant, input) pair runs in its own process so that type feedback gathered for one variant
 * never shapes the code compiled for another. Each process builds the input, makes 4 warm-up calls,
 * then times each measured call with performance.now() and reports the mean, the median, and p95. Every
 * result is kept in a variable so nothing is eliminated as dead code.
 *
 * The mean covers the fastest 90 percent of the measured calls. The comparison with the baseline uses
 * the mean, because the median is not stable. Garbage collection makes the call times of one process
 * alternate between two groups. The median is in one group or the other, and the group differs between
 * processes. With --runs, the processes of the variants alternate, so a change in machine load affects
 * every variant.
 */
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { generateAttributeDocument, generateMpd, generateTextDocument } from './generate.ts'

type ParseFunction = (input: string) => unknown

type Variant = {
	name: string
	/** Module specifier that the worker process imports */
	specifier: string
}

type Input = {
	name: string
	make: () => string
	iterations: number
}

type Stats = {
	/** Mean of the fastest 90 percent of the measured calls */
	mean: number
	median: number
	p95: number
}

type WorkerResult = {
	length: number
	stats: Stats
}

const WARM_UP_CALLS = 4
const MEAN_SHARE = 0.9
const CHECK_RUNS = 5
const FIXTURES = resolve(import.meta.dirname, '../test/fixtures')
const PACKAGE = '@svta/cml-xml'

const args = process.argv.slice(2)

function option(name: string): string | undefined {
	const prefix = `--${name}=`
	return args.find(arg => arg.startsWith(prefix))?.slice(prefix.length)
}

function numberOption(name: string, fallback: number | undefined, min: number): number | undefined {
	const value = option(name)
	if (value === undefined) {
		return fallback
	}
	const parsed = Number(value)
	if (value === '' || Number.isNaN(parsed) || parsed < min) {
		throw new Error(`--${name} expects a number of ${min} or more, received "${value}"`)
	}
	return parsed
}

const forceGc = args.includes('--gc')
const baseline = option('baseline')
const build = option('build')
const only = option('only')
const worker = option('worker')
const threshold = numberOption('threshold', undefined, 0)
const runs = numberOption('runs', threshold === undefined ? 1 : CHECK_RUNS, 1) as number

if (threshold !== undefined && baseline === undefined) {
	throw new Error('--threshold requires --baseline')
}

const inputs: Input[] = [
	{
		name: 'pretty />, 100k S',
		make: () => generateMpd({ pretty: true }),
		iterations: forceGc ? 20 : 60,
	},
	{
		name: 'minified />, 100k S',
		make: () => generateMpd({ pretty: false }),
		iterations: forceGc ? 20 : 60,
	},
	{
		name: 'pretty </S>, 100k S',
		make: () => generateMpd({ pretty: true, closed: true }),
		iterations: forceGc ? 20 : 60,
	},
	{
		name: 'livesim2 real, 5402 S',
		make: () => readFileSync(resolve(FIXTURES, 'livesim2_tsbd21600.mpd'), 'utf8'),
		iterations: 300,
	},
	{
		name: 'livesim2-scale 60x2x20 </S>',
		make: () => generateMpd({ periods: 60, adaptationSets: 2, segments: 20, closed: true }),
		iterations: 300,
	},
	{
		name: 'bbb_30fps.mpd',
		make: () => readFileSync(resolve(FIXTURES, 'bbb_30fps.mpd'), 'utf8'),
		iterations: 3000,
	},
	{
		name: 'text nodes, 5000 of 100 chars',
		make: () => generateTextDocument(5000, 100),
		iterations: 300,
	},
	{
		name: 'text nodes, 500 of 1000 chars',
		make: () => generateTextDocument(500, 1000),
		iterations: 300,
	},
	{
		name: 'text nodes, 20 of 100k chars',
		make: () => generateTextDocument(20, 100_000),
		iterations: 300,
	},
	{
		name: 'attribute values, 5000 of 300 chars',
		make: () => generateAttributeDocument(5000, 300),
		iterations: 300,
	},
].filter(input => only === undefined || input.name.includes(only))

let sink: unknown = null

function stats(times: number[]): Stats {
	const sorted = [...times].sort((a, b) => a - b)
	const fastest = sorted.slice(0, Math.ceil(sorted.length * MEAN_SHARE))
	return {
		mean: fastest.reduce((sum, time) => sum + time, 0) / fastest.length,
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
 * Installs a published version of the package, with its peer dependencies, into a temporary folder
 * outside the repository. Returns the folder of the installed package.
 */
function installFromNpm(version: string): string {
	const folder = mkdtempSync(join(tmpdir(), 'cml-xml-bench-'))
	process.on('exit', () => rmSync(folder, { recursive: true, force: true }))

	// The scope option overrides a registry that .npmrc or setup-node configures for @svta.
	const npmArgs = [
		'install',
		'--prefix',
		folder,
		'--no-save',
		'--no-audit',
		'--no-fund',
		'--ignore-scripts',
		'--@svta:registry=https://registry.npmjs.org/',
		`${PACKAGE}@${version}`,
	]
	const proc = spawnSync('npm', npmArgs, { encoding: 'utf8' })
	if (proc.status !== 0) {
		throw new Error(`npm install ${PACKAGE}@${version} failed:\n${proc.stderr}`)
	}

	return join(folder, 'node_modules', PACKAGE)
}

/**
 * Resolves a `<build>` option value to a variant.
 */
function resolveVariant(value: string): Variant {
	if (value !== 'npm' && !value.startsWith('npm:')) {
		return { name: `parseXml (${value})`, specifier: pathToFileURL(resolve(value)).href }
	}

	const root = installFromNpm(value === 'npm' ? 'latest' : value.slice('npm:'.length))
	const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
		version: string
	}
	return {
		name: `parseXml (npm ${version})`,
		specifier: pathToFileURL(join(root, 'dist/index.js')).href,
	}
}

/**
 * Worker mode: times the parseXml of one module on one input and prints the result as JSON.
 */
async function measure(specifier: string, input: Input): Promise<void> {
	const collect = forceGc ? gc : undefined
	if (forceGc && collect === undefined) {
		throw new Error('--gc requires node --expose-gc')
	}

	const { parseXml: parse } = (await import(specifier)) as { parseXml: ParseFunction }
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
 * Spawns one worker process for one variant and one input.
 */
function spawnWorker(variant: Variant, inputIndex: number): WorkerResult {
	const nodeArgs = [
		...(forceGc ? ['--expose-gc'] : []),
		'--no-warnings',
		resolve(import.meta.filename),
		`--worker=${inputIndex},${variant.specifier}`,
		...args,
	]
	const proc = spawnSync(process.execPath, nodeArgs, { encoding: 'utf8' })
	if (proc.status !== 0) {
		throw new Error(proc.stderr)
	}
	const lines = proc.stdout.trim().split('\n')
	return JSON.parse(lines[lines.length - 1]) as WorkerResult
}

/**
 * Driver mode: spawns the worker processes, prints a table per input, and applies the threshold.
 */
function drive(): void {
	const variants: Variant[] = [
		build === undefined
			? { name: 'parseXml (this build)', specifier: PACKAGE }
			: resolveVariant(build),
	]
	if (baseline !== undefined) {
		variants.unshift(resolveVariant(baseline))
	}
	const failures: string[] = []

	console.log(
		`Node ${process.version}, ${process.arch}, ${forceGc ? 'full GC before each call' : 'natural GC'}, ${runs === 1 ? 'one process' : `lowest mean of ${runs} processes`} per variant and input, ${WARM_UP_CALLS} warm-up calls\n`,
	)

	inputs.forEach((input, inputIndex) => {
		const results: WorkerResult[] = []
		for (let round = 0; round < runs; round++) {
			variants.forEach((variant, variantIndex) => {
				const result = spawnWorker(variant, inputIndex)
				const best = results[variantIndex]
				if (best === undefined || result.stats.mean < best.stats.mean) {
					results[variantIndex] = result
				}
			})
		}

		console.log(
			`### ${input.name} (${results[0].length.toLocaleString('en-US')} chars, ${input.iterations} iterations)\n`,
		)
		console.log('| Variant | Mean | Median | p95 | Mean vs baseline |')
		console.log('| --- | ---: | ---: | ---: | ---: |')
		results.forEach((result, variantIndex) => {
			console.log(
				`| ${variants[variantIndex].name} | ${formatMs(result.stats.mean)} | ${formatMs(result.stats.median)} | ${formatMs(result.stats.p95)} | ${formatDelta(result.stats.mean, results[0].stats.mean)} |`,
			)
		})
		console.log('')

		if (threshold !== undefined) {
			const base = results[0].stats.mean
			const value = results[results.length - 1].stats.mean
			if (((value - base) / base) * 100 > threshold) {
				failures.push(
					`${input.name}: ${formatMs(base)} to ${formatMs(value)}, ${formatDelta(value, base)}`,
				)
			}
		}
	})

	if (threshold !== undefined) {
		const names = `${variants[1].name} against ${variants[0].name}`
		if (failures.length === 0) {
			console.log(`PASS: ${names}, no input is slower by more than ${threshold}%`)
		} else {
			console.log(
				`FAIL: ${names}, ${failures.length} of ${inputs.length} inputs are slower by more than ${threshold}%\n`,
			)
			failures.forEach(failure => console.log(`- ${failure}`))
			process.exitCode = 1
		}
	}
}

if (worker !== undefined) {
	const separator = worker.indexOf(',')
	await measure(worker.slice(separator + 1), inputs[Number(worker.slice(0, separator))])
} else {
	drive()
}

if (sink === undefined) {
	console.log('unreachable')
}
