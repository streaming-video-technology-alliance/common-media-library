/**
 * Script to regenerate test snapshot JSON files with the new Segment structure
 */
import { writeFileSync } from 'node:fs'
import {
	dashToHam,
	hamToDash,
	hlsToHam,
	setDashParser,
	setDashSerializer,
	setHlsParser,
	type DashManifest,
	type HlsManifest,
} from '../src/index.ts'
import { Parser } from 'm3u8-parser'
import { Builder, parseString } from 'xml2js'

// Initialize parsers and serializers
setDashParser((raw: string) => {
	let parsed!: DashManifest
	parseString(raw, (err: Error | null, result: DashManifest) => {
		if (err) {
			throw new Error(err.message)
		}
		parsed = result
	})
	return parsed
})

setHlsParser((text: string) => {
	const parser = new Parser()
	parser.push(text)
	parser.end()
	const parsedHlsManifest = parser.manifest as any
	if (!parsedHlsManifest) {
		throw new Error()
	}
	return parsedHlsManifest as HlsManifest
})

setDashSerializer((manifest: DashManifest) => {
	const builder = new Builder()
	return builder.buildObject(manifest)
})

// Import DASH samples
import { dashSample as dashSample0 } from './data/dash-samples/sample-0/sample.ts'
import { dashSample as dashSample1 } from './data/dash-samples/sample-1/sample.ts'
import { dashSample as dashSample2 } from './data/dash-samples/sample-2/sample.ts'
import { dashSample as dashSample3 } from './data/dash-samples/sample-3/sample.ts'
import { dashSample as dashSample4 } from './data/dash-samples/sample-4/sample.ts'
import { dashSample as dashSample5 } from './data/dash-samples/sample-5/sample.ts'
import { dashSample as dashSample6 } from './data/dash-samples/sample-6/sample.ts'
import { dashSample as dashSample7 } from './data/dash-samples/sample-7/sample.ts'
import { dashSample as dashSample8 } from './data/dash-samples/sample-8/sample.ts'

// Import HLS samples
import { hlsMain1, hlsPlaylist1 } from './data/hls-samples/sample-1/hlsSample1.ts'
import { hlsMain2, hlsPlaylist2 } from './data/hls-samples/sample-2/hlsSample2.ts'
import { hlsMain3, hlsPlaylist3 } from './data/hls-samples/sample-3/hlsSample3.ts'

console.log('Regenerating DASH to HAM snapshots...')

// Convert DASH samples to HAM
const ham0 = dashToHam(dashSample0)
const ham1 = dashToHam(dashSample1)
const ham2 = dashToHam(dashSample2)
const ham3 = dashToHam(dashSample3)
const ham4 = dashToHam(dashSample4)
const ham5 = dashToHam(dashSample5)
const ham6 = dashToHam(dashSample6)
const ham7 = dashToHam(dashSample7)
const ham8 = dashToHam(dashSample8)

// Write DASH to HAM snapshots
writeFileSync('./test/data/ham-samples/fromDash/ham0.json', JSON.stringify(ham0, null, 2))
writeFileSync('./test/data/ham-samples/fromDash/ham1.json', JSON.stringify(ham1, null, 2))
writeFileSync('./test/data/ham-samples/fromDash/ham2.json', JSON.stringify(ham2, null, 2))
writeFileSync('./test/data/ham-samples/fromDash/ham3.json', JSON.stringify(ham3, null, 2))
writeFileSync('./test/data/ham-samples/fromDash/ham4.json', JSON.stringify(ham4, null, 2))
writeFileSync('./test/data/ham-samples/fromDash/ham5.json', JSON.stringify(ham5, null, 2))
writeFileSync('./test/data/ham-samples/fromDash/ham6.json', JSON.stringify(ham6, null, 2))
writeFileSync('./test/data/ham-samples/fromDash/ham7.json', JSON.stringify(ham7, null, 2))
writeFileSync('./test/data/ham-samples/fromDash/ham8.json', JSON.stringify(ham8, null, 2))

console.log('✅ DASH to HAM snapshots regenerated')

console.log('Regenerating HLS to HAM snapshots...')

// Convert HLS samples to HAM
const hamFromHls1 = hlsToHam(hlsMain1, hlsPlaylist1)
const hamFromHls2 = hlsToHam(hlsMain2, hlsPlaylist2)
const hamFromHls3 = hlsToHam(hlsMain3, hlsPlaylist3)

// Write HLS to HAM snapshots
writeFileSync('./test/data/ham-samples/fromHls/ham1.json', JSON.stringify(hamFromHls1, null, 2))
writeFileSync('./test/data/ham-samples/fromHls/ham2.json', JSON.stringify(hamFromHls2, null, 2))
writeFileSync('./test/data/ham-samples/fromHls/ham3.json', JSON.stringify(hamFromHls3, null, 2))

console.log('✅ HLS to HAM snapshots regenerated')

console.log('Regenerating HAM to DASH snapshots...')

// Use the newly generated ham3 for the reverse conversion
// Note: ham3 is already an array of Presentations, don't wrap it again
const dashFromHam3 = hamToDash(ham3)

writeFileSync('./test/data/dash-samples/fromHam/dashFromHam3.json', JSON.stringify(dashFromHam3.manifest, null, 2))

console.log('✅ HAM to DASH snapshots regenerated')

console.log('\n✅ All snapshots regenerated successfully!')
