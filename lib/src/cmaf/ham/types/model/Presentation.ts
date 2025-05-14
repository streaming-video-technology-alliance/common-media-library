import type { Ham } from './Ham';
import type { SelectionSet } from './SelectionSet';

/**
 * CMAF-HAM Presentation type
 *
 * selectionSets - List of SelectionSets
 *
 * @group CMAF
 * @alpha
 */
export type Presentation = Ham & {
	selectionSets: SelectionSet[];
};
