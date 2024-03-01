import { m3u8ToHam, hamToM3U8 } from './m3u8Converter.js';
import fs from 'fs';

const dir = 'C:/Users/noeli/cmaf/downloaded_playlists';
const main = 'ToS_AVC_HEVC_MutliRate_MultiRes_IFrame_AAC.m3u8';
const order = ['tears-of-steel-aac-64k.m3u8','tears-of-steel-aac-128k.m3u8','tears-of-steel-avc1-400k.m3u8', 'tears-of-steel-avc1-750k.m3u8', 'tears-of-steel-avc1-1000k.m3u8', 'tears-of-steel-avc1-1500k.m3u8', 'tears-of-steel-avc1-2200k.m3u8', 'tears-of-steel-hev1-1100k.m3u8', 'tears-of-steel-hev1-1500k.m3u8', 'tears-of-steel-hev1-2200k.m3u8', 'tears-of-steel-avc1-400k.m3u8', 'tears-of-steel-avc1-750k.m3u8', 'tears-of-steel-avc1-1000k.m3u8', 'tears-of-steel-avc1-1500k.m3u8', 'tears-of-steel-avc1-2200k.m3u8', 'tears-of-steel-hev1-1100k.m3u8', 'tears-of-steel-hev1-1500k.m3u8', 'tears-of-steel-hev1-2200k.m3u8'];

function readOrderArrayAndReturnManifest(dir: string, main: string, order: string[]) {
	const mainManifest = fs.readFileSync(`${dir}/${main}`, 'utf8');
	const ancillaryManifests = order.map((file) => fs.readFileSync(`${dir}/${file}`, 'utf8'));
	return {
		mainManifest,
		ancillaryManifests,
	};
}
// function readM3u8Files(dir: string, main: string) {
// 	const files = fs.readdirSync(dir);
// 	//get the name of the files ordered by name
// 	const mainManifest = fs.readFileSync(`${dir}/${main}`, 'utf8');
// 	const ancillaryManifests = files
// 		.filter((file) => file !== main)
// 		.filter((file) => file.includes('.m3u8'))
// 		.map((file) => fs.readFileSync(`${dir}/${file}`, 'utf8'));
// 	return {
// 		mainManifest,
// 		ancillaryManifests,
// 		nameFiles: files.filter(
// 			(file) => file !== main && file.includes('.m3u8'),
// 		),
// 	};
// }

const { mainManifest, ancillaryManifests } = readOrderArrayAndReturnManifest(
	dir,
	main,
	order
);
console.log(ancillaryManifests.length);
const ham = m3u8ToHam(mainManifest, ancillaryManifests);
const m3u8 = hamToM3U8(ham);
//make a directory to save the m3u8 files
const outputDir = 'C:/Users/noeli/cmaf/output';
//write the main m3u8 file
fs.writeFileSync(`${outputDir}/main.m3u8`, m3u8.manifest, 'utf8');
//write the ancillary m3u8 files
let index = 0;
m3u8.ancillaryManifests?.forEach((ancillary) => {
	fs.writeFileSync(
		`${outputDir}/${order[index]}`,
		ancillary.manifest,
		'utf8',
	);
	index++;
});
