import type { IsoBoxSpan } from './hasIsoBoxSpan.ts'
import type { IsoBox } from './IsoBox.ts'
import type { IsoInt64 } from './IsoInt64.ts'
import type { IsoRawBox } from './IsoRawBox.ts'

/**
 * A box that `readIsoBoxes` returns: a box object of a box type of `IsoBoxMap`, or a raw box.
 *
 * The four-character code of any box is `box.type`.
 * Use `isIsoBoxType` to narrow a box to a box type. A test of `box.type` does not exclude a raw box.
 * The test `'bytes' in box` narrows a box to a raw box.
 *
 * @public
 */
export type ParsedIsoBox<V extends IsoInt64 = number> = IsoBox<V> | IsoRawBox

/**
 * The boxes that `readIsoBoxes` and `readChildBoxes` return.
 *
 * The type parameter `S` is the type of the `spans` option. With the literal `true`, every box has the `start` and `end` fields of `IsoBoxSpan`.
 * With any other type, the boxes have the type `ParsedIsoBox<V>`.
 *
 * @public
 */
export type ParsedIsoBoxList<V extends IsoInt64 = number, S extends boolean = boolean> = [
	S,
] extends [true]
	? (ParsedIsoBox<V> & IsoBoxSpan)[]
	: ParsedIsoBox<V>[]
