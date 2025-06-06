import type { AlignedSwitchingSet } from './AlignedSwitchingSet.js';
import type { Ham } from './Ham.js';
import type { SwitchingSet } from './SwitchingSet.js';

/**
 * CMAF-HAM SelectionSet type
 *
 * @group CMAF
 * @alpha
 */
export type SelectionSet = Ham & {
	switchingSets: SwitchingSet[];
	alignedSwitchingSets?: AlignedSwitchingSet[];
};
