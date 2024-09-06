import { readFileSync } from 'fs';

export const dashSample: string = readFileSync(
	'./manifest.mpd',
	'utf8',
);
