import { SwitchingSet } from './SwitchingSet.js';
import { Ham } from './Ham.js';

/**
 * CMAF-HAM SelectionSet type
 *
 * @group CMAF
 *
 * @beta
 */
type SelectionSet = Ham & {
	switchingSets: SwitchingSet[];
};

export type { SelectionSet };
