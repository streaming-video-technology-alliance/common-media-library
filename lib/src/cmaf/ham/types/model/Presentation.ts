import { Ham } from './Ham.js';
import { SelectionSet } from './SelectionSet.js';

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
