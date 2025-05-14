import type { SfBareItem } from './SfBareItem';
import type { SfItem } from './SfItem';
import type { SfParameters } from './SfParameters';

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
