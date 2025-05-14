import type { AlignedSwitchingSet } from './AlignedSwitchingSet';
import type { Ham } from './Ham';
import type { SwitchingSet } from './SwitchingSet';

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
