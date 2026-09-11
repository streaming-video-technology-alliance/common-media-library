// Summarizes a V8 .cpuprofile: self time per function and per file.
// usage: node summarize-profile.mjs <file.cpuprofile> [top]
import console from 'node:console'
import { readFileSync } from 'node:fs'
import process from 'node:process'

const [file, topArg = '25'] = process.argv.slice(2)
const profile = JSON.parse(readFileSync(file, 'utf8'))
const nodes = new Map(profile.nodes.map(node => [node.id, node]))
const selfTime = new Map()
let total = 0
for (let i = 0; i < profile.samples.length; i++) {
	const delta = profile.timeDeltas[i] ?? 0
	total += delta
	selfTime.set(profile.samples[i], (selfTime.get(profile.samples[i]) ?? 0) + delta)
}

const byFunction = new Map()
const byFile = new Map()
for (const [id, time] of selfTime) {
	const { callFrame } = nodes.get(id)
	const shortUrl = callFrame.url.replace(/^file:\/\/.*?\/(?=libs\/|plans\/|node_modules\/)/, '')
	const fn = `${callFrame.functionName || '(anonymous)'} ${shortUrl}:${callFrame.lineNumber + 1}`
	byFunction.set(fn, (byFunction.get(fn) ?? 0) + time)
	const fileKey = shortUrl === '' ? `(${callFrame.functionName || 'native'})` : shortUrl
	byFile.set(fileKey, (byFile.get(fileKey) ?? 0) + time)
}

const pct = time => `${((time / total) * 100).toFixed(1)}%`
console.log(`total sampled ${(total / 1000).toFixed(0)} ms\n\nby file:`)
for (const [name, time] of [...byFile].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
	console.log(`  ${pct(time).padStart(6)}  ${name}`)
}
console.log(`\ntop functions by self time:`)
for (const [name, time] of [...byFunction].sort((a, b) => b[1] - a[1]).slice(0, Number(topArg))) {
	console.log(`  ${pct(time).padStart(6)}  ${name}`)
}
