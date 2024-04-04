import { Track, Ham } from './index.js';

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
