import { readFileSync } from 'fs';

const hlsMain2 = readFileSync(
	'./test/cmaf/ham/data/hls-samples/sample-2/main.m3u8',
	'utf8',
);

const aac_128k = readFileSync(
	'./test/cmaf/ham/data/hls-samples/sample-2/audio-aac-128k.m3u8',
	'utf8',
);

const hev1_1500k = readFileSync(
	'./test/cmaf/ham/data/hls-samples/sample-2/video-hev1-1500k.m3u8',
	'utf8',
);

const hlsPlaylist2 = [aac_128k, hev1_1500k];

export { hlsMain2, hlsPlaylist2 };
