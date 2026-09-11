// Runs bench.mjs for every implementation in its own process, several interleaved passes,
// and prints one markdown table with the median over passes.
//
// usage: node run-all.mjs <passes> <label>=<api>=<dist> ...
import { spawnSync } from 'node:child_process'
import console from 'node:console'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'

const [passesArg, ...specs] = process.argv.slice(2)
const passes = Number(passesArg)
const impls = specs.map(spec => {
	const [label, api, dist] = spec.split('=')
	return { label, api, dist }
})
const dir = mkdtempSync(join(tmpdir(), 'cmcd-bench-'))
const results = new Map(impls.map(impl => [impl.label, []]))

for (let pass = 0; pass < passes; pass++) {
	for (const impl of impls) {
		const json = join(dir, `${impl.label}-${pass}.json`)
		const run = spawnSync(process.execPath, [
			'--expose-gc', '--min-semi-space-size=64', '--max-semi-space-size=64', join(import.meta.dirname, 'bench.mjs'),
			'--dist', impl.dist, '--api', impl.api, '--label', impl.label, '--json', json,
		], { stdio: ['ignore', 'inherit', 'inherit'] })
		if (run.status !== 0) {
			throw new Error(`${impl.label} failed in pass ${pass}`)
		}
		results.get(impl.label).push(JSON.parse(readFileSync(json, 'utf8')))
	}
}

const median = values => {
	const sorted = [...values].sort((a, b) => a - b)
	return sorted[Math.floor((sorted.length - 1) / 2)]
}
const us = ns => (ns / 1000).toFixed(2)
const first = results.get(impls[0].label)[0]
const names = Object.keys(first.scenarios)

console.log(`\nNode ${first.node}, ${passes} passes, median of per-pass medians. Microseconds per operation, then heap bytes allocated per operation.\n`)
console.log(`| Scenario | ${impls.map(impl => impl.label).join(' | ')} |`)
console.log(`|---|${impls.map(() => '---').join('|')}|`)
for (const name of names) {
	const cells = impls.map(impl => {
		const runs = results.get(impl.label)
		const time = median(runs.map(run => run.scenarios[name].median))
		const p90 = median(runs.map(run => run.scenarios[name].p90))
		const bytes = median(runs.map(run => run.scenarios[name].bytesPerOp))
		return `${us(time)} us (p90 ${us(p90)}), ${Math.round(bytes).toLocaleString('en-US')} B`
	})
	console.log(`| ${name} | ${cells.join(' | ')} |`)
}
const retained = impls.map(impl => `${Math.round(median(results.get(impl.label).map(run => run.retainedBytesAfter20kCycles)) / 1024)} KB`)
console.log(`| retained heap after 20k cycles | ${retained.join(' | ')} |`)
const gcs = impls.map(impl => {
	const runs = results.get(impl.label)
	return median(runs.map(run => run.scenarios['segment cycle, one event target'].gcPer10k)).toFixed(1)
})
console.log(`| GC events per 10k segment cycles | ${gcs.join(' | ')} |`)

console.log(`\nSpread between passes (max median over min median) per scenario:\n`)
console.log(`| Scenario | ${impls.map(impl => impl.label).join(' | ')} |`)
console.log(`|---|${impls.map(() => '---').join('|')}|`)
for (const name of names) {
	const cells = impls.map(impl => {
		const medians = results.get(impl.label).map(run => run.scenarios[name].median)
		return (Math.max(...medians) / Math.min(...medians)).toFixed(2)
	})
	console.log(`| ${name} | ${cells.join(' | ')} |`)
}
console.log(`\nraw results in ${dir}`)
