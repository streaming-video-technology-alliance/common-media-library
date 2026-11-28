import type { IsoBoxType } from './IsoBoxType.ts'
import type { IsoInt64 } from './IsoInt64.ts'
import type { IsoInt64Reader } from './IsoInt64Reader.ts'

/**
 * A position in the bytes of ISO BMFF data, for the read field functions and the box readers.
 *
 * `start`, `pos`, and `end` count bytes from the first byte of `view`.
 * A field function reads at `pos` and moves `pos` past the field.
 * A field function that reads past `end` throws a `RangeError`.
 *
 * The type parameter `V` is the type of every 64-bit integer field that the built-in readers return.
 * A cursor of either mode is assignable to `IsoBoxReadCursor<IsoInt64>`.
 * The type parameter `S` is the type of the `spans` option. With the literal `true`, `readChildBoxes` returns boxes with the fields of `IsoBoxSpan`.
 *
 * @public
 */
export type IsoBoxReadCursor<V extends IsoInt64 = number, S extends boolean = boolean> = {
	/**
	 * The bytes to read.
	 */
	readonly view: DataView

	/**
	 * The first byte of the box header, or 0 for a new cursor.
	 */
	readonly start: number

	/**
	 * The position of the next read. A reader can move the position, as in `cursor.pos += 4`.
	 */
	pos: number

	/**
	 * The first byte after the box, or the byte length of the data for a new cursor.
	 */
	readonly end: number

	/**
	 * Map of each box type to the reader of that box. `readChildBoxes` uses the map.
	 * If a reader returns `undefined`, `readChildBoxes` returns a raw box. `IsoBoxReaderMap` allows `undefined` only for the `uuid` key.
	 */
	readonly readers?: Record<
		IsoBoxType,
		{ r(cursor: IsoBoxReadCursor<V>, type: IsoBoxType): { type: IsoBoxType } | undefined }['r']
	>

	/**
	 * If `true`, `readChildBoxes` sets the `start` and `end` fields of `IsoBoxSpan` on every box that it returns.
	 */
	readonly spans?: S
} & ([V] extends [bigint]
	? {
			/**
			 * The function that reads every 64-bit integer field of the built-in readers.
			 */
			readonly int64: IsoInt64Reader<V>
		}
	: {
			/**
			 * The function that reads every 64-bit integer field of the built-in readers.
			 * With no function, the readers return each field as a `number`.
			 */
			readonly int64?: IsoInt64Reader<V>
		})
