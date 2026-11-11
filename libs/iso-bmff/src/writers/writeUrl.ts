import type { DataEntryUrlBox } from '../boxes/DataEntryUrlBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a `DataEntryUrlBox` to an `IsoBoxWriteView`.
 *
 * The writer omits `location` when flag `0x000001` is set.
 *
 * ISO/IEC 14496-12:2012 - 8.7.2 Data Reference Box
 *
 * @param box - The `DataEntryUrlBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the encoded box
 *
 * @public
 */
export function writeUrl(box: DataEntryUrlBox): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4
	const hasLocation = !(box.flags & 0x000001)
	const locationSize = hasLocation ? box.location.length + 1 : 0 // null-terminated
	const totalSize = headerSize + fullBoxSize + locationSize

	const writer = new IsoBoxWriteView('url ', totalSize)
	writer.writeFullBox(box.version, box.flags)

	if (hasLocation) {
		writer.writeTerminatedString(box.location)
	}

	return writer
}
