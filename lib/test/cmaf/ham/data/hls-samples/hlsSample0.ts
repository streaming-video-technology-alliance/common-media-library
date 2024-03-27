import { readFileSync } from 'fs';

const hlsMain0 = readFileSync(
	'./test/cmaf/ham/data/hls-samples/sample-0/ToS_AVC_HEVC_MutliRate_MultiRes_IFrame_AAC.m3u8',
	'utf8',
);

const aac_64k = readFileSync(
	'./test/cmaf/ham/data/hls-samples/sample-0/tears-of-steel-aac-64k.m3u8',
	'utf8',
);

const aac_128k = readFileSync(
	'./test/cmaf/ham/data/hls-samples/sample-0/tears-of-steel-aac-128k.m3u8',
	'utf8',
);

const avc1_400k = readFileSync(
	'./test/cmaf/ham/data/hls-samples/sample-0/tears-of-steel-avc1-400k.m3u8',
	'utf8',
);

const avc1_750k = readFileSync(
	'./test/cmaf/ham/data/hls-samples/sample-0/tears-of-steel-avc1-750k.m3u8',
	'utf8',
);

const avc1_1000k = readFileSync(
	'./test/cmaf/ham/data/hls-samples/sample-0/tears-of-steel-avc1-1000k.m3u8',
	'utf8',
);

const avc1_1500k = readFileSync(
	'./test/cmaf/ham/data/hls-samples/sample-0/tears-of-steel-avc1-1500k.m3u8',
	'utf8',
);

const avc1_2200k = readFileSync(
	'./test/cmaf/ham/data/hls-samples/sample-0/tears-of-steel-avc1-2200k.m3u8',
	'utf8',
);

const hev1_1100k = readFileSync(
	'./test/cmaf/ham/data/hls-samples/sample-0/tears-of-steel-hev1-1100k.m3u8',
	'utf8',
);

const hev1_1500k = readFileSync(
	'./test/cmaf/ham/data/hls-samples/sample-0/tears-of-steel-hev1-1500k.m3u8',
	'utf8',
);

const hev1_2200k = readFileSync(
	'./test/cmaf/ham/data/hls-samples/sample-0/tears-of-steel-hev1-2200k.m3u8',
	'utf8',
);

const hlsPlaylist0 = [
	aac_64k,
	aac_128k,
	avc1_400k,
	avc1_750k,
	avc1_1000k,
	avc1_1500k,
	avc1_2200k,
	hev1_1100k,
	hev1_1500k,
	hev1_2200k,
];

export { hlsMain0, hlsPlaylist0 };
