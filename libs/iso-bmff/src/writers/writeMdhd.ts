import type { MediaHeaderBox } from '../boxes/MediaHeaderBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a MediaHeaderBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 8.4.2 Media Header Box
 *
 * @param box - The MediaHeaderBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeMdhd(box: MediaHeaderBox): IsoBoxWriteView {
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

	writer.writeUint(box.creationTime, size)
	writer.writeUint(box.modificationTime, size)
	writer.writeUint(box.timescale, 4)
	writer.writeUint(box.duration, size)

	// Encode ISO-639-2/T language code as 3 5-bit integers in a 16-bit value
	// Format: bits 14-10 (char1), bits 9-5 (char2), bits 4-0 (char3)
	// Each character code is (charCode - 0x60) to convert from ASCII to 5-bit value
	const lang = box.language.length >= 3
		? (((box.language.charCodeAt(0) - 0x60) & 0x1F) << 10) |
		(((box.language.charCodeAt(1) - 0x60) & 0x1F) << 5) |
		((box.language.charCodeAt(2) - 0x60) & 0x1F)
		: 0 // Default to "und" (undefined) if invalid
	writer.writeUint(lang, 2)

	writer.writeUint(box.preDefined, 2)

	return writer
}
