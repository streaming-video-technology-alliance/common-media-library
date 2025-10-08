import type { Ham } from './Ham.js';
import type { Track } from './Track.js';

/**
 * CMAF-HAM SwitchingSet type
 *
 * @alpha
 */
export type SwitchingSet = Ham & {
	tracks: Track[];
};
