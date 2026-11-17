import type { MovieExtendsHeaderBox } from '../boxes/MovieExtendsHeaderBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `mehd` box (`MovieExtendsHeaderBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.8.2
 *
 * Each 64-bit integer field of the box is a `number` or a `bigint`.
 * The writer throws a `RangeError` for a `bigint` that does not fit the field.
 *
 * @param box - The `MovieExtendsHeaderBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
export function writeMehd(box: MovieExtendsHeaderBox<IsoInt64>): IsoBoxWriteView {
	const v1 = box.version === 1
	const size = v1 ? 8 : 4
	const headerSize = 8
	const fullBoxSize = 4
	const fragmentDurationSize = size
	const totalSize = headerSize + fullBoxSize + fragmentDurationSize

	const writer = new IsoBoxWriteView('mehd', totalSize)
	writer.writeFullBox(box.version, box.flags)
	writer.writeWideUint(box.fragmentDuration, size)

	return writer
}
