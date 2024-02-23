import { Track } from './Track.js';
import { Ham } from './Ham.js';

type SwitchingSet = Ham & {
	tracks: Track[];
}

export type { SwitchingSet };
