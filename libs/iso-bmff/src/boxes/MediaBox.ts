import type { IsoInt64 } from '../IsoInt64.ts'
import type { HandlerReferenceBox } from './HandlerReferenceBox.ts'
import type { MediaHeaderBox } from './MediaHeaderBox.ts'
import type { MediaInformationBox } from './MediaInformationBox.ts'

/**
 * Child boxes of Media Box
 *
 * @public
 */
export type MediaBoxChild<V extends IsoInt64 = number> =
	| MediaHeaderBox<V>
	| HandlerReferenceBox
	| MediaInformationBox

/**
 * Media Box - 'mdia' - Container
 *
 * @public
 */
export type MediaBox<V extends IsoInt64 = number> = {
	type: 'mdia'
	boxes: MediaBoxChild<V>[]
}
