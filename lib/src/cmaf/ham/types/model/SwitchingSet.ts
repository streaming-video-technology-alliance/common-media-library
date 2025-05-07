import type { Ham } from './Ham.ts';
import type { Track } from './Track.ts';

/**
 * CMAF-HAM SwitchingSet type
 *
 * @group CMAF
 * @alpha
 */
export type SwitchingSet = Ham & {
	tracks: Track[];
};
