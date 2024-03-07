import { SelectionSet } from './SelectionSet.js';
import { Ham } from './Ham.js';

/**
 * CMAF-HAM Presentation type
 *
 * @group CMAF
 *
 * @beta
 */
type Presentation = Ham & {
	selectionSets: SelectionSet[];
};

export type { Presentation };
