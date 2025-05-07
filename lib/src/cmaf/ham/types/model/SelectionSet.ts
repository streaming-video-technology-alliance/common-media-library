import type { Ham } from './Ham.ts';
import type { AlignedSwitchingSet } from './AlignedSwitchingSet.ts';
import type { SwitchingSet } from './SwitchingSet.ts';

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
