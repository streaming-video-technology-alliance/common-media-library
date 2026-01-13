import type { DataEntryUrnBox } from '../boxes/DataEntryUrnBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a `DataEntryUrnBox` to an `IsoBoxWriteView`.
 *
 * ISO/IEC 14496-12:2012 - 8.7.2 Data Reference Box
 *
 * @param box - The `DataEntryUrnBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the encoded box
 *
 * @public
 */
export function writeUrn(box: DataEntryUrnBox): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4
	const nameSize = box.name.length + 1 // null-terminated
	const locationSize = box.location.length + 1 // null-terminated
	const totalSize = headerSize + fullBoxSize + nameSize + locationSize

	const writer = new IsoBoxWriteView('urn ', totalSize)
	writer.writeFullBox(box.version, box.flags)
	writer.writeTerminatedString(box.name)
	writer.writeTerminatedString(box.location)

	return writer
}
