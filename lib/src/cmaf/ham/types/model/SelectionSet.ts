import { SwitchingSet } from './SwitchingSet.js';
import { Ham } from './Ham.js';

/**
 * CMAF-HAM SelectionSet type
 *
 * @group CMAF
 *
 * @alpha
 */
type SelectionSet = Ham & {
	switchingSets: SwitchingSet[];
	alignedSwitchingSets?: SwitchingSet[];
};

export type { SelectionSet };
