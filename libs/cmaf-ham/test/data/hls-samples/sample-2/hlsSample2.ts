import { readFileSync } from 'fs'

const hlsMain2: string = readFileSync(
	new URL('./main.m3u8', import.meta.url),
	'utf8',
)

const aac_64k = readFileSync(
	new URL('./tears-of-steel-aac-64k.m3u8', import.meta.url),
	'utf8',
)

const aac_128k = readFileSync(
	new URL('./tears-of-steel-aac-128k.m3u8', import.meta.url),
	'utf8',
)

const hev1_1100k = readFileSync(
	new URL('./tears-of-steel-hev1-1100k.m3u8', import.meta.url),
	'utf8',
)

const hev1_1500k = readFileSync(
	new URL('./tears-of-steel-hev1-1500k.m3u8', import.meta.url),
	'utf8',
)

const hev1_2200k = readFileSync(
	new URL('./tears-of-steel-hev1-2200k.m3u8', import.meta.url),
	'utf8',
)

const hlsPlaylist2: string[] = [aac_64k, aac_128k, hev1_1100k, hev1_1500k, hev1_2200k]

export { hlsMain2, hlsPlaylist2 }
