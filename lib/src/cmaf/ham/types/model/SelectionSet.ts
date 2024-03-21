import { SwitchingSet, AlignedSwitchingSet, Ham } from './index.js';

/**
 * CMAF-HAM SelectionSet type
 *
 * @group CMAF
 *
 * @alpha
 */
type SelectionSet = Ham & {
	switchingSets: SwitchingSet[];
	alignedSwitchingSets?: AlignedSwitchingSet[];
};

export type { SelectionSet };
