import type { DataEntryUrlBox } from '../boxes/DataEntryUrlBox.ts'
import type { Fields } from '../boxes/Fields.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a UrlBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 8.7.2 Data Reference Box
 *
 * @param box - The UrlBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeUrl(box: Fields<DataEntryUrlBox>): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4
	const locationSize = box.location.length + 1 // null-terminated
	const totalSize = headerSize + fullBoxSize + locationSize

	const writer = new IsoBoxWriteView(totalSize)
	writer.writeBoxHeader('url ', totalSize)
	writer.writeFullBox(box.version, box.flags)
	writer.writeTerminatedString(box.location)

	return writer
}
