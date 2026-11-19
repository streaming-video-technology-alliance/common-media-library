import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeLegacyView } from '../cursor/writeLegacyView.ts'
import type { MediaHeaderBox } from '../boxes/MediaHeaderBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `mdhd` box (`MediaHeaderBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.4.2
 *
 * Each 64-bit integer field of the box is a `number` or a `bigint`.
 * The writer throws a `RangeError` for a `bigint` that does not fit the field.
 *
 * @param cursor - The write cursor
 * @param box - The `MediaHeaderBox` fields to write
 *
 * @public
 */
export function writeMdhd(cursor: IsoBoxWriteCursor, box: MediaHeaderBox<IsoInt64>): void {
	const size = box.version === 1 ? 8 : 4
	const headerSize = 8
	const fullBoxSize = 4
	const timesSize = size * 3 // creationTime, modificationTime, duration
	const timescaleSize = 4
	const languageSize = 2
	const preDefined = 2
	const totalSize = headerSize + fullBoxSize + timesSize + timescaleSize + languageSize + preDefined

	const writer = new IsoBoxWriteView('mdhd', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeWideUint(box.creationTime, size)
	writer.writeWideUint(box.modificationTime, size)
	writer.writeUint(box.timescale, 4)
	writer.writeWideUint(box.duration, size)

	// Encode ISO-639-2/T language code as 3 5-bit integers in a 16-bit value
	// Format: bits 14-10 (char1), bits 9-5 (char2), bits 4-0 (char3)
	// Each character code is (charCode - 0x60) to convert from ASCII to 5-bit value
	const lang =
		box.language.length >= 3
			? (((box.language.charCodeAt(0) - 0x60) & 0x1f) << 10) |
				(((box.language.charCodeAt(1) - 0x60) & 0x1f) << 5) |
				((box.language.charCodeAt(2) - 0x60) & 0x1f)
			: 0 // Default to "und" (undefined) if invalid
	writer.writeUint(lang, 2)

	writer.writeUint(box.preDefined ?? 0, 2)

	writeLegacyView(cursor, writer)
}
