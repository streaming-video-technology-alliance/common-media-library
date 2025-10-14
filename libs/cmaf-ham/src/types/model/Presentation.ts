import type { Ham } from './Ham.ts';
import type { SelectionSet } from './SelectionSet.ts';

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
