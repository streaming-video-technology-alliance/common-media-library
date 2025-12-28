import type { DataEntryUrnBox } from '../boxes/DataEntryUrnBox.ts'
import type { Fields } from '../boxes/Fields.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a UrnBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 8.7.2 Data Reference Box
 *
 * @param box - The UrnBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeUrn(box: Fields<DataEntryUrnBox>): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4
	const nameSize = box.name.length + 1 // null-terminated
	const locationSize = box.location.length + 1 // null-terminated
	const totalSize = headerSize + fullBoxSize + nameSize + locationSize

	const writer = new IsoBoxWriteView(totalSize)
	writer.writeBoxHeader('urn ', totalSize)
	writer.writeFullBox(box.version, box.flags)
	writer.writeTerminatedString(box.name)
	writer.writeTerminatedString(box.location)

	return writer
}
