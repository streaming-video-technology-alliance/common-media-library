import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeLegacyView } from '../cursor/writeLegacyView.ts'
import type { TrackFragmentRandomAccessBox } from '../boxes/TrackFragmentRandomAccessBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `tfra` box (`TrackFragmentRandomAccessBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.8.10
 *
 * Each 64-bit integer field of the box is a `number` or a `bigint`.
 * The writer throws a `RangeError` for a `bigint` that does not fit the field.
 *
 * @param cursor - The write cursor
 * @param box - The `TrackFragmentRandomAccessBox` fields to write
 *
 * @public
 */
export function writeTfra(
	cursor: IsoBoxWriteCursor,
	box: TrackFragmentRandomAccessBox<IsoInt64>,
): void {
	const v1 = box.version === 1
	const timeSize = v1 ? 8 : 4
	const entrySize =
		timeSize +
		timeSize + // time + moofOffset
		(box.lengthSizeOfTrafNum + 1) +
		(box.lengthSizeOfTrunNum + 1) +
		(box.lengthSizeOfSampleNum + 1)

	const headerSize = 8
	const fullBoxSize = 4
	const trackIdSize = 4
	const reservedSize = 4
	const numberOfEntrySize = 4
	const entriesSize = box.numberOfEntry * entrySize
	const totalSize =
		headerSize + fullBoxSize + trackIdSize + reservedSize + numberOfEntrySize + entriesSize

	const writer = new IsoBoxWriteView('tfra', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.trackId, 4)

	// Pack the length sizes. The 26 reserved bits are 0.
	const lengthSizes =
		(box.lengthSizeOfTrafNum << 4) | (box.lengthSizeOfTrunNum << 2) | box.lengthSizeOfSampleNum
	writer.writeUint(lengthSizes, 4)

	writer.writeUint(box.numberOfEntry, 4)

	for (const entry of box.entries) {
		writer.writeWideUint(entry.time, timeSize)
		writer.writeWideUint(entry.moofOffset, timeSize)
		writer.writeUint(entry.trafNumber, box.lengthSizeOfTrafNum + 1)
		writer.writeUint(entry.trunNumber, box.lengthSizeOfTrunNum + 1)
		writer.writeUint(entry.sampleNumber, box.lengthSizeOfSampleNum + 1)
	}

	writeLegacyView(cursor, writer)
}
