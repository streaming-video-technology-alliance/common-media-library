import { readFileSync } from 'fs';

export const dashSample = readFileSync(
	'./manifest.mpd',
	'utf8',
);
