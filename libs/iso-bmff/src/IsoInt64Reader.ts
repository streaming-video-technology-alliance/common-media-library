import type { IsoBoxReadCursor } from './IsoBoxReadCursor.ts'
import type { IsoInt64 } from './IsoInt64.ts'

/**
 * The value of the `int64` option of `IsoBoxReadConfig`.
 *
 * The function reads one integer field of 4 or 8 bytes at the position of the cursor.
 * `readWideUint` and `readWideInt` call the function for every field that a reader reads with them.
 * The return type is the type of every 64-bit field in the result.
 *
 * The function reads the field with the field functions, such as `readUint32` and `readUint64`.
 * The function must not call `readWideUint` or `readWideInt`, because those functions call the function.
 *
 * @param cursor - The cursor to read the field from.
 * @param size - The size of the field in bytes.
 * @param signed - Whether the field is a signed integer.
 * @returns The value of the field.
 *
 * @public
 */
export type IsoInt64Reader<V extends IsoInt64 = number> = (
	cursor: IsoBoxReadCursor<IsoInt64>,
	size: 4 | 8,
	signed: boolean,
) => V
