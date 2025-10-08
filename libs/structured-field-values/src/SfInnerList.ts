import type { SfBareItem } from './SfBareItem.js';
import type { SfItem } from './SfItem.js';
import type { SfParameters } from './SfParameters.js';

/**
 * Structured Field Inner List
 *
 *
 * @beta
 */
export type SfInnerList = {
	value: SfItem[] | SfBareItem[],
	params: SfParameters,
};
