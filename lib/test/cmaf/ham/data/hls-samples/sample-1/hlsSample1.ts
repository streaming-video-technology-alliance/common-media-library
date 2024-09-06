import { readFileSync } from 'fs';

const hlsMain1: string = readFileSync(
	'./main.m3u8',
	'utf8',
);

const aac_100k = readFileSync(
	'./playlist_a-eng-0128k-aac-2c.mp4.m3u8',
	'utf8',
);

const mp4_144p = readFileSync(
	'./playlist_v-0144p-0100k-libx264.mp4.m3u8',
	'utf8',
);

const mp4_240p = readFileSync(
	'./playlist_v-0240p-0400k-libx264.mp4.m3u8',
	'utf8',
);

const mp4_360p = readFileSync(
	'./playlist_v-0360p-0750k-libx264.mp4.m3u8',
	'utf8',
);

const mp4_480p = readFileSync(
	'./playlist_v-0480p-1000k-libx264.mp4.m3u8',
	'utf8',
);

const mp4_576p = readFileSync(
	'./playlist_v-0576p-1400k-libx264.mp4.m3u8',
	'utf8',
);

const mp4_720p = readFileSync(
	'./playlist_v-0720p-2500k-libx264.mp4.m3u8',
	'utf8',
);

const hlsPlaylist1: string[] = [
	aac_100k,
	mp4_144p,
	mp4_240p,
	mp4_360p,
	mp4_480p,
	mp4_576p,
	mp4_720p,
];

export { hlsMain1, hlsPlaylist1 };
