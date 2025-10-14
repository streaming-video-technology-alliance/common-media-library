import type { AlignedSwitchingSet } from './AlignedSwitchingSet.ts';
import type { Ham } from './Ham.ts';
import type { SwitchingSet } from './SwitchingSet.ts';

/**
 * CMAF-HAM SelectionSet type
 *
 * @alpha
 */
export type SelectionSet = Ham & {
	switchingSets: SwitchingSet[];
	alignedSwitchingSets?: AlignedSwitchingSet[];
};
