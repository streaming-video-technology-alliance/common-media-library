import { m3u8ToHam, hamToM3U8 } from './m3u8Converter.js';
import fs from 'fs';

const directory = 'C:/Users/noeli/cmaf/downloaded_playlists';
const outputDir = 'C:/Users/noeli/cmaf/output';
const manifest = 'ToS_AVC_HEVC_MutliRate_MultiRes_IFrame_AAC.m3u8';
const orderedPlaylists = [
	'tears-of-steel-aac-64k.m3u8',
	'tears-of-steel-aac-128k.m3u8',
	'tears-of-steel-avc1-400k.m3u8',
	'tears-of-steel-avc1-750k.m3u8',
	'tears-of-steel-avc1-1000k.m3u8',
	'tears-of-steel-avc1-1500k.m3u8',
	'tears-of-steel-avc1-2200k.m3u8',
	'tears-of-steel-hev1-1100k.m3u8',
	'tears-of-steel-hev1-1500k.m3u8',
	'tears-of-steel-hev1-2200k.m3u8',
	'tears-of-steel-avc1-400k.m3u8',
	'tears-of-steel-avc1-750k.m3u8',
	'tears-of-steel-avc1-1000k.m3u8',
	'tears-of-steel-avc1-1500k.m3u8',
	'tears-of-steel-avc1-2200k.m3u8',
	'tears-of-steel-hev1-1100k.m3u8',
	'tears-of-steel-hev1-1500k.m3u8',
	'tears-of-steel-hev1-2200k.m3u8',
];

function readPlaylists(dir: string, main: string, order: string[]) {
	const mainManifest = fs.readFileSync(`${dir}/${main}`, 'utf8');
	const ancillaryManifests = order.map((file) =>
		fs.readFileSync(`${dir}/${file}`, 'utf8'),
	);
	return {
		mainManifest,
		ancillaryManifests,
	};
}

const { mainManifest, ancillaryManifests } = readPlaylists(
	directory,
	manifest,
	orderedPlaylists,
);

// Convert m3u8 to ham object
const ham = m3u8ToHam(mainManifest, ancillaryManifests);
const m3u8 = hamToM3U8(ham);

//Write the main m3u8 file
fs.writeFileSync(`${outputDir}/main.m3u8`, m3u8.manifest, 'utf8');

//Write the ancillary m3u8 files
let index = 0;
m3u8.ancillaryManifests?.forEach((ancillary) => {
	fs.writeFileSync(
		`${outputDir}/${orderedPlaylists[index++]}`,
		ancillary.manifest,
		'utf8',
	);
});
