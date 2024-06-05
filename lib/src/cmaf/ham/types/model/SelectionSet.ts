import { Ham } from './Ham.js';
import { AlignedSwitchingSet } from './AlignedSwitchingSet.js';
import { SwitchingSet } from './SwitchingSet.js';

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
