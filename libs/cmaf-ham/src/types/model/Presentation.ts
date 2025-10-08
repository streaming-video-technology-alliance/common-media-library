import type { Ham } from './Ham.js';
import type { SelectionSet } from './SelectionSet.js';

/**
 * CMAF-HAM Presentation type
 *
 * selectionSets - List of SelectionSets
 *
 * @alpha
 */
export type Presentation = Ham & {
	selectionSets: SelectionSet[];
};
