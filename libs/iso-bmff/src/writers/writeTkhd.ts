import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeLegacyView } from '../cursor/writeLegacyView.ts'
import type { TrackHeaderBox } from '../boxes/TrackHeaderBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { INT } from '../IsoBoxFields.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `tkhd` box (`TrackHeaderBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.3.2
 *
 * Each 64-bit integer field of the box is a `number` or a `bigint`.
 * The writer throws a `RangeError` for a `bigint` that does not fit the field.
 *
 * @param cursor - The write cursor
 * @param box - The `TrackHeaderBox` fields to write
 *
 * @example
 * {@includeCode ../../test/writers/writeTkhd.test.ts#example}
 *
 * @public
 */
export function writeTkhd(cursor: IsoBoxWriteCursor, box: TrackHeaderBox<IsoInt64>): void {
	const v1 = box.version === 1
	const size = v1 ? 8 : 4
	const headerSize = 8
	const fullBoxSize = 4
	const timesSize = size * 3 // creationTime, modificationTime, duration
	const trackIdSize = 4
	const reserved1Size = 4
	const reserved2Size = 8 // 2 x 4 bytes
	const layerSize = 2
	const alternateGroupSize = 2
	const volumeSize = 2
	const reserved3Size = 2
	const matrixSize = 36 // 9 x 4 bytes
	const widthSize = 4
	const heightSize = 4

	const totalSize =
		headerSize +
		fullBoxSize +
		timesSize +
		trackIdSize +
		reserved1Size +
		reserved2Size +
		layerSize +
		alternateGroupSize +
		volumeSize +
		reserved3Size +
		matrixSize +
		widthSize +
		heightSize

	const writer = new IsoBoxWriteView('tkhd', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeWideUint(box.creationTime, size)
	writer.writeWideUint(box.modificationTime, size)
	writer.writeUint(box.trackId, 4)
	writer.writeUint(0, 4)
	writer.writeWideUint(box.duration, size)
	writer.writeUint(0, 4)
	writer.writeUint(0, 4)
	writer.writeInt(box.layer, 2)
	writer.writeInt(box.alternateGroup, 2)
	writer.writeTemplate(box.volume, 2)
	writer.writeUint(0, 2)
	// ISO/IEC 14496-12, 6.2.2: u, v, and w are 2.30 values.
	writer.writeArray(
		box.matrix.map((value, i) => Math.round(value * (i % 3 === 2 ? 0x40000000 : 0x10000))),
		INT,
		4,
		9,
	)
	writer.writeTemplate(box.width, 4)
	writer.writeTemplate(box.height, 4)

	writeLegacyView(cursor, writer)
}
