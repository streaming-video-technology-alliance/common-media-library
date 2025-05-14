import type { Ham } from './Ham';
import type { Track } from './Track';

/**
 * CMAF-HAM SwitchingSet type
 *
 * @group CMAF
 * @alpha
 */
export type SwitchingSet = Ham & {
	tracks: Track[];
};
