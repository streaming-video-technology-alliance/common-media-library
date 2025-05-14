import type { SfBareItem } from './SfBareItem';
import type { SfInnerList } from './SfInnerList';
import type { SfItem } from './SfItem';

/**
 * A member of a structured field.
 *
 * @group Structured Field
 *
 * @beta
 */
export type SfMember = SfItem | SfInnerList | SfBareItem;
