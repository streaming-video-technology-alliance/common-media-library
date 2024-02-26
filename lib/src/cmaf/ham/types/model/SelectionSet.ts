import { SwitchingSet } from './SwitchingSet.js';
import { Ham } from './Ham.js';

type SelectionSet = Ham & {
	switchingSets: SwitchingSet[];
}

export type { SelectionSet };
