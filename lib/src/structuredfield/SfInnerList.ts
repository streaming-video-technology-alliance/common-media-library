import { SfBareItem } from './SfBareItem.js';
import { SfItem } from './SfItem.js';
import { SfParameters } from './SfParameters.js';

/**
 * Structured Field Inner List
 *
 * @group Structured Field
 *
 * @beta
 */
export type SfInnerList = {
	value: SfItem[] | SfBareItem[],
	params: SfParameters,
};
