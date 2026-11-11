import type { IsoBoxReadView } from './IsoBoxReadView.ts'
import type { IsoInt64 } from './IsoInt64.ts'

/**
 * The value of the `int64` option of `IsoBoxReadViewConfig`.
 *
 * The function reads one integer field of 4 or 8 bytes from the view.
 * The view calls the function for every field that a reader reads with `readWideUint` or `readWideInt`.
 * The return type is the type of every 64-bit field in the result.
 *
 * The function reads the field with `readUint`, `readInt`, or `readUint64`.
 * The function must not call `readWideUint` or `readWideInt`, because those methods call the function.
 *
 * @param view - The view to read the field from.
 * @param size - The size of the field in bytes.
 * @param signed - Whether the field is a signed integer.
 * @returns The value of the field.
 *
 * @public
 */
export type IsoInt64Reader<V extends IsoInt64 = number> = (
	view: IsoBoxReadView<IsoInt64>,
	size: 4 | 8,
	signed: boolean,
) => V
