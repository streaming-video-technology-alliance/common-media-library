import type { SfBareItem } from './SfBareItem.ts';
import type { SfInnerList } from './SfInnerList.ts';
import type { SfItem } from './SfItem.ts';

/**
 * A member of a structured field.
 *
 * @group Structured Field
 *
 * @beta
 */
export type SfMember = SfItem | SfInnerList | SfBareItem;
