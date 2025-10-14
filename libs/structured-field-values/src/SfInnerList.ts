import type { SfBareItem } from './SfBareItem.ts';
import type { SfItem } from './SfItem.ts';
import type { SfParameters } from './SfParameters.ts';

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
