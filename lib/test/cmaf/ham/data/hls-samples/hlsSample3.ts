import { readFileSync } from 'fs';

const hlsMain3 = readFileSync(
	'./test/cmaf/ham/data/hls-samples/sample-3/main.m3u8',
	'utf8',
);

const aac_38k = readFileSync(
	'./test/cmaf/ham/data/hls-samples/sample-3/audio-eng-038k-aac-6c.mp4.m3u8',
	'utf8',
);

const aac_128k = readFileSync(
	'./test/cmaf/ham/data/hls-samples/sample-3/audio-eng-0128k-aac-2c.mp4.m3u8',
	'utf8',
);

const webvtt_el = readFileSync(
	'./test/cmaf/ham/data/hls-samples/sample-3/playlist_s-el.webvtt.m3u8',
	'utf8',
);

const webvtt_en = readFileSync(
	'./test/cmaf/ham/data/hls-samples/sample-3/playlist_s-en.webvtt.m3u8',
	'utf8',
);

const mp4_750k = readFileSync(
	'./test/cmaf/ham/data/hls-samples/sample-3/video-0360p-0750k-libx264.mp4.m3u8',
	'utf8',
);

const mp4_1000k = readFileSync(
	'./test/cmaf/ham/data/hls-samples/sample-3/video-0480p-1000k-libx264.mp4.m3u8',
	'utf8',
);

const mp4_1400k = readFileSync(
	'./test/cmaf/ham/data/hls-samples/sample-3/video-0576p-1400k-libx264.mp4.m3u8',
	'utf8',
);

const hlsPlaylist3 = [
	aac_38k,
	aac_128k,
	webvtt_el,
	webvtt_en,
	mp4_750k,
	mp4_1000k,
	mp4_1400k,
];

export { hlsMain3, hlsPlaylist3 };
