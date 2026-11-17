import { encodeText } from '@svta/cml-utils'
import type { DataEntryUrlBox } from '../boxes/DataEntryUrlBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `url ` box (`DataEntryUrlBox`).
 *
 * The writer omits `location` when flag `0x000001` is set.
 *
 * ISO/IEC 14496-12:2015 - 8.7.2
 *
 * @param box - The `DataEntryUrlBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
export function writeUrl(box: DataEntryUrlBox): IsoBoxWriteView {
	const locationBytes = box.flags & 0x000001 ? undefined : encodeText(box.location)

	const headerSize = 8
	const fullBoxSize = 4
	const locationSize = locationBytes ? locationBytes.length + 1 : 0 // null-terminated
	const totalSize = headerSize + fullBoxSize + locationSize

	const writer = new IsoBoxWriteView('url ', totalSize)
	writer.writeFullBox(box.version, box.flags)

	if (locationBytes) {
		writer.writeBytes(locationBytes)
		writer.writeUint(0, 1)
	}

	return writer
}
