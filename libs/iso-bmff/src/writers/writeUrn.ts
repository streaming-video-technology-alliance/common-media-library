import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeLegacyView } from '../cursor/writeLegacyView.ts'
import { encodeText } from '@svta/cml-utils'
import type { DataEntryUrnBox } from '../boxes/DataEntryUrnBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `urn ` box (`DataEntryUrnBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.2
 *
 * @param cursor - The write cursor
 * @param box - The `DataEntryUrnBox` fields to write
 *
 * @example
 * {@includeCode ../../test/writers/writeUrn.test.ts#example}
 *
 * @public
 */
export function writeUrn(cursor: IsoBoxWriteCursor, box: DataEntryUrnBox): void {
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

	writeLegacyView(cursor, writer)
}
