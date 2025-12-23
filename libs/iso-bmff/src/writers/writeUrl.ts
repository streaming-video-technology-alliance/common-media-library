import type { Fields } from '../boxes/Fields.ts'
import type { UrlBox } from '../boxes/UrlBox.ts'
import { IsoDataWriter } from '../utils/IsoDataWriter.ts'

/**
 * Write a UrlBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 8.7.2 Data Reference Box
 *
 * @param box - The UrlBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @beta
 */
export function writeUrl(box: Fields<UrlBox>): IsoDataWriter {
	const headerSize = 8
	const fullBoxSize = 4
	const locationSize = box.location.length + 1 // null-terminated
	const totalSize = headerSize + fullBoxSize + locationSize

	const writer = new IsoDataWriter(totalSize)
	writer.writeBoxHeader('url ', totalSize)
	writer.writeFullBox(box.version, box.flags)
	writer.writeTerminatedString(box.location)

	return writer
}
