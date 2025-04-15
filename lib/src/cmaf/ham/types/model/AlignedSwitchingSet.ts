import type { SwitchingSet } from './SwitchingSet.ts';

/**
 * CMAF-HAM Aligned Switching Set type
 *
 * @group CMAF
 * @alpha
 */
export type AlignedSwitchingSet = {
	switchingSets: SwitchingSet[];
};
