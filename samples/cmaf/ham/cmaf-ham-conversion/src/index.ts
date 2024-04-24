import fs from 'fs';
import {
	hamToHls,
	hamToDash,
	hlsToHam,
	dashToHam,
	validatePresentation,
} from '@svta/common-media-library/cmaf-ham';
import { listM3U8Files, listDirectories, listMPDFiles } from './utils.js';

const FILE_ENCODING = 'utf8';

const INPUT_PATH_HLS = `./input/hls/`;
const OUTPUT_PATH_HLS = `./output/hls/`;

const SAMPLES_PATH_DASH = `./input/dash/`;
const OUTPUT_PATH_DASH = `./output/dash/`;

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
	const manifest = fs.readFileSync(mainManifestPath, FILE_ENCODING);
	const ancillaryManifests = AncillaryManifestsPath?.map(
		(ancillaryManifest) =>
			fs.readFileSync(ancillaryManifest, FILE_ENCODING),
	);

	// Convert the Manifest to HAM
	const ham = mainManifestPath.endsWith('.m3u8')
		? hlsToHam(manifest, ancillaryManifests)
		: dashToHam(manifest);

	// Create output directory if it doesn't exist
	if (!fs.existsSync(outputPath)) {
		fs.mkdirSync(outputPath, { recursive: true });
	}

	// Run validations and save them to a file
	const validations = ham.map(validatePresentation);
	fs.writeFileSync(
		`${outputPath}/validations.json`,
		JSON.stringify(validations),
	);

	// Save HAM object
	fs.writeFileSync(`${outputPath}/ham.json`, JSON.stringify(ham));

	// Convert the HAM to DASH and save the MPD file
	const dash = hamToDash(ham);
	fs.writeFileSync(`${outputPath}/main.mpd`, dash.manifest);

	// Convert the HAM to HLS and save the m3u8 files
	const hls = hamToHls(ham);
	fs.writeFileSync(`${outputPath}/main.m3u8`, hls.manifest);
	hls.ancillaryManifests?.forEach((ancillaryManifest, index: any) => {
		fs.writeFileSync(
			`${outputPath}/${ancillaryManifest.fileName ?? `${index + 1}.m3u8`}`,
			ancillaryManifest.manifest,
		);
	});
}

listDirectories(SAMPLES_PATH_DASH).forEach((contentDir) => {
	const mpds = listMPDFiles(`${SAMPLES_PATH_DASH}/${contentDir}`);
	mpds.forEach((mpd) => {
		manifestToAllFormats(mpd, `${OUTPUT_PATH_DASH}/${contentDir}`);
	});
});

listDirectories(INPUT_PATH_HLS).forEach((contentDir) => {
	const hlsManifests = listM3U8Files(`${INPUT_PATH_HLS}/${contentDir}`);
	if (!hlsManifests.error) {
		manifestToAllFormats(
			hlsManifests.manifest,
			`${OUTPUT_PATH_HLS}/${contentDir}`,
			hlsManifests.playlists,
		);
	}
});
