import { SelectionSet } from './SelectionSet.js';
import { Ham } from './Ham.js';

type Presentation = Ham & {
	selectionSets: SelectionSet[];
};

export type { Presentation };
