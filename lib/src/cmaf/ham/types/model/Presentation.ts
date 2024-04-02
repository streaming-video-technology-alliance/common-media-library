import { SelectionSet, Ham } from './index.js';

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
