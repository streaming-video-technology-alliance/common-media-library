import { Ham } from './Ham.js';
import { SelectionSet } from './SelectionSet.js';

/**
 * CMAF-HAM Presentation type
 *
 * @group CMAF
 * @alpha
 */
type Presentation = Ham & {
	selectionSets: SelectionSet[];
};

export type { Presentation };
