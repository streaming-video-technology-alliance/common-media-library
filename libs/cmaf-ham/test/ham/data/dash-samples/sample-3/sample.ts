import { readFileSync } from 'fs';

export const dashSample: string = readFileSync(
	new URL('./manifest.mpd', import.meta.url),
	'utf8',
);
