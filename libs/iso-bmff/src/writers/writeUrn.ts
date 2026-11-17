import { encodeText } from '@svta/cml-utils'
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
	const nameBytes = encodeText(box.name)
	const locationBytes = encodeText(box.location)

	const headerSize = 8
	const fullBoxSize = 4
	const nameSize = nameBytes.length + 1 // null-terminated
	const locationSize = locationBytes.length + 1 // null-terminated
	const totalSize = headerSize + fullBoxSize + nameSize + locationSize

	const writer = new IsoBoxWriteView('urn ', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeBytes(nameBytes)
	writer.writeUint(0, 1)
	writer.writeBytes(locationBytes)
	writer.writeUint(0, 1)

	return writer
}
