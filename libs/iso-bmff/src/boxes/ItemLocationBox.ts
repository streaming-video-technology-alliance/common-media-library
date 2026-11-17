import type { FullBox } from './FullBox.ts'
import type { ItemLocation } from './ItemLocation.ts'

/**
 * Item Location Box (`iloc`).
 *
 * ISO/IEC 14496-12:2015 - 8.11.3
 *
 * @public
 */
export type ItemLocationBox = FullBox & {
	type: 'iloc'
	offsetSize: number
	lengthSize: number
	baseOffsetSize: number
	indexSize?: number
	itemCount: number
	items: ItemLocation[]
}
