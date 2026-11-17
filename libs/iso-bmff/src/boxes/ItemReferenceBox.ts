import type { SingleItemTypeReferenceBox } from './SingleItemTypeReferenceBox.ts'

/**
 * Child boxes of Item Reference Box
 *
 * @public
 */
export type ItemReferenceBoxChild = SingleItemTypeReferenceBox

/**
 * Item Reference Box (`iref`).
 *
 * ISO/IEC 14496-12:2015 - 8.11.12
 *
 * @public
 */
export type ItemReferenceBox = {
	type: 'iref'
	boxes: ItemReferenceBoxChild[]
}
