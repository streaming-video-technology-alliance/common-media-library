import { Ham } from './Ham.js';
import { AlignedSwitchingSet } from './AlignedSwitchingSet.js';
import { SwitchingSet } from './SwitchingSet.js';

/**
 * CMAF-HAM SelectionSet type
 *
 * @group CMAF
 * @alpha
 */
type SelectionSet = Ham & {
	switchingSets: SwitchingSet[];
	alignedSwitchingSets?: AlignedSwitchingSet[];
};

export type { SelectionSet };
