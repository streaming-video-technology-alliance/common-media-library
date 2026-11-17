import type { ItemInfoEntry } from './ItemInfoEntry.ts'

/**
 * Child boxes of Item Info Box
 *
 * @public
 */
export type ItemInfoBoxChild = ItemInfoEntry

/**
 * Item Info Box (`iinf`).
 *
 * ISO/IEC 14496-12:2015 - 8.11.6
 *
 * @public
 */
export type ItemInfoBox = {
	type: 'iinf'
	boxes: ItemInfoBoxChild[]
	entryCount: number
}
