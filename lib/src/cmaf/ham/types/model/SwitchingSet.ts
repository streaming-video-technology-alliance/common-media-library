import { Ham } from './Ham.js';
import { Track } from './Track.js';

/**
 * CMAF-HAM SwitchingSet type
 *
 * @group CMAF
 * @alpha
 */
type SwitchingSet = Ham & {
	tracks: Track[];
};

export type { SwitchingSet };
