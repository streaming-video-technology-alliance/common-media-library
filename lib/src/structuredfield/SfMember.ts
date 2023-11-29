import { SfBareItem } from './SfBareItem.js';
import { SfInnerList } from './SfInnerList.js';
import { SfItem } from './SfItem.js';

/**
 * A member of a structured field.
 *
 * @group Structured Field
 *
 * @beta
 */
export type SfMember = SfItem | SfInnerList | SfBareItem;
