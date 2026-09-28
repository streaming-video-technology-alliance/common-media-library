import {
	dashToHam,
	hamToDash,
	hamToHls,
	hlsToHam,
	setDashParser,
	setDashSerializer,
	setHlsParser,
	validatePresentation,
	type DashManifest,
	type HlsManifest,
} from '@svta/cml-cmaf-ham'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Parser } from 'm3u8-parser'
import { Builder, parseString } from 'xml2js'
import { listDirectories, listM3U8Files, listMPDFiles } from './utils.ts'

const FILE_ENCODING = 'utf8'

// Resolve every folder from the location of this script, so the sample runs from any working directory.
const SAMPLE_ROOT = fileURLToPath(new URL('..', import.meta.url))

const INPUT_PATH_HLS = path.join(SAMPLE_ROOT, 'input', 'hls')
const OUTPUT_PATH_HLS = path.join(SAMPLE_ROOT, 'dist', 'hls')

const INPUT_PATH_DASH = path.join(SAMPLE_ROOT, 'input', 'dash')
const OUTPUT_PATH_DASH = path.join(SAMPLE_ROOT, 'dist', 'dash')

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

setDashParser((raw: string) => {
	let parsed: DashManifest | undefined
	parseString(raw, (err: Error | null, result: DashManifest) => {
		if (err) {
			throw new Error(err.message)
		}
		parsed = result as DashManifest
	})
	return parsed
})

setDashSerializer((manifest: DashManifest) => {
	const builder = new Builder()
	return builder.buildObject(manifest)
})

/**
 * This function converts a given manifest file (along with optional playlists for HLS)
 * into different formats (HLS, DASH and HAM) and saves them to a specified output directory.
 * The function handles both HLS and DASH manifest formats.
 *
 * @param mainManifestPath - The path to the main manifest file.
 * @param outputPath - The path to the directory where the output files will be saved.
 * @param AncillaryManifestsPath - An optional array of paths to ancillary manifest files (only for HLS).
 */
function manifestToAllFormats(
	mainManifestPath: string,
	outputPath: string,
	AncillaryManifestsPath?: string[],
) {
	// Read the Manifests
	const manifest = fs.readFileSync(mainManifestPath, FILE_ENCODING)
	const ancillaryManifests = AncillaryManifestsPath?.map(
		(ancillaryManifest) =>
			fs.readFileSync(ancillaryManifest, FILE_ENCODING),
	)

	// Convert the Manifest to HAM
	const ham = mainManifestPath.endsWith('.m3u8')
		? hlsToHam(manifest, ancillaryManifests)
		: dashToHam(manifest)

	// Create output directory if it doesn't exist
	if (!fs.existsSync(outputPath)) {
		fs.mkdirSync(outputPath, { recursive: true })
	}

	// Run validations and save them to a file
	const validations = ham.map(validatePresentation)
	fs.writeFileSync(
		path.join(outputPath, 'validations.json'),
		JSON.stringify(validations),
	)

	// Save HAM object
	fs.writeFileSync(path.join(outputPath, 'ham.json'), JSON.stringify(ham))

	// Convert the HAM to DASH and save the MPD file
	const dash = hamToDash(ham)
	fs.writeFileSync(path.join(outputPath, 'main.mpd'), dash.manifest)

	// Convert the HAM to HLS and save the m3u8 files.
	// An ancillary manifest may have an empty file name, so fall back to a numbered name.
	const hls = hamToHls(ham)
	fs.writeFileSync(path.join(outputPath, 'main.m3u8'), hls.manifest)
	hls.ancillaryManifests?.forEach((ancillaryManifest, index: number) => {
		fs.writeFileSync(
			path.join(outputPath, ancillaryManifest.fileName || `${index + 1}.m3u8`),
			ancillaryManifest.manifest,
		)
	})
}

listDirectories(INPUT_PATH_DASH).forEach((contentDir) => {
	const mpds = listMPDFiles(path.join(INPUT_PATH_DASH, contentDir))
	mpds.forEach((mpd) => {
		manifestToAllFormats(mpd, path.join(OUTPUT_PATH_DASH, contentDir))
	})
})

listDirectories(INPUT_PATH_HLS).forEach((contentDir) => {
	const hlsManifests = listM3U8Files(path.join(INPUT_PATH_HLS, contentDir))
	if (!hlsManifests.error) {
		manifestToAllFormats(
			hlsManifests.manifest,
			path.join(OUTPUT_PATH_HLS, contentDir),
			hlsManifests.playlists,
		)
	}
})
