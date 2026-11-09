// Usage: node bench.ts <module> [bigint]
// <module> is one of the files that patch.py writes, such as base.js or variantC.js.
import type { IsoBoxReadViewConfig } from '@svta/cml-iso-bmff'

type Package = typeof import('@svta/cml-iso-bmff')
type BenchConfig = IsoBoxReadViewConfig & { int64?: 'number' | 'bigint' }

const [, , mod = 'base.js', mode] = process.argv
const { readIsoBoxes, readTfdt, readMfhd, readSidx } = (await import(`./${mod}`)) as Package

// One fragment header set per iteration: tfdt v1 (20 bytes), mfhd (16 bytes), sidx v1 with no references (40 bytes).
const BOXES = 30000
const tfdt = [
	0, 0, 0, 20, 0x74, 0x66, 0x64, 0x74, 1, 0, 0, 0, 0x00, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01,
]
const mfhd = [0, 0, 0, 16, 0x6d, 0x66, 0x68, 0x64, 0, 0, 0, 0, 0, 0, 0, 7]
const sidx = [
	0, 0, 0, 40, 0x73, 0x69, 0x64, 0x78, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0x27, 0x10, 0, 0, 0, 0, 0, 0,
	0, 5, 0, 0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0,
]
const bytes: number[] = []
for (let i = 0; i < BOXES / 3; i++) bytes.push(...tfdt, ...mfhd, ...sidx)
const buffer = new Uint8Array(bytes).buffer

const config: BenchConfig = { readers: { tfdt: readTfdt, mfhd: readMfhd, sidx: readSidx } }
if (mode === 'bigint') config.int64 = 'bigint'

// Sanity: the field type follows the mode when the variant supports it.
const first = readIsoBoxes(buffer, config)[0] as { baseMediaDecodeTime?: unknown } | undefined
const sample = typeof first?.baseMediaDecodeTime

for (let i = 0; i < 100; i++) readIsoBoxes(buffer, config) // warm up
const times: number[] = []
for (let i = 0; i < 100; i++) {
	const t0 = process.hrtime.bigint()
	readIsoBoxes(buffer, config)
	times.push(Number(process.hrtime.bigint() - t0))
}
times.sort((a, b) => a - b)
const median = times[times.length >> 1] ?? 0
console.log(
	`${mod.padEnd(12)} ${(mode ?? 'number').padEnd(7)} field=${sample.padEnd(6)} median ${(median / BOXES).toFixed(1)} ns/box`,
)
