import type { IsoBoxReadCursor } from './IsoBoxReadCursor.ts'
import type { IsoBoxType } from './IsoBoxType.ts'
import type { IsoInt64 } from './IsoInt64.ts'

/**
 * A function that reads the fields of one box at the position of a read cursor and returns the box.
 *
 * The position is the first byte after the box header. For a `uuid` box, the position is the first byte of `usertype`.
 * The result is the complete box with its `type` field.
 * The type parameter `V` is the type of the 64-bit integer fields of the cursor that the reader accepts.
 *
 * @public
 */
export type IsoBoxReader<
	B extends { type: IsoBoxType } = { type: IsoBoxType },
	V extends IsoInt64 = number,
> = (cursor: IsoBoxReadCursor<V>, type: B['type']) => B
