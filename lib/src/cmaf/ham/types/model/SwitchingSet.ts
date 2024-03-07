import { Track } from './Track.js';
import { Ham } from './Ham.js';

/**
 * CMAF-HAM SwitchingSet type
 *
 * @group CMAF
 *
 * @beta
 */
type SwitchingSet = Ham & {
	tracks: Track[];
};

export type { SwitchingSet };
