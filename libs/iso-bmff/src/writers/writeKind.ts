import { encodeText } from '@svta/cml-utils'
import type { TrackKindBox } from '../boxes/TrackKindBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a TrackKindBox to an IsoDataWriter.
 *
 * @param box - The TrackKindBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeKind(box: TrackKindBox): IsoBoxWriteView {
	const schemeUriBytes = encodeText(box.schemeUri)
	const valueBytes = encodeText(box.value)

	const headerSize = 8
	const fullBoxSize = 4
	const schemeUriSize = schemeUriBytes.length + 1 // null-terminated
	const valueSize = valueBytes.length + 1 // null-terminated
	const totalSize = headerSize + fullBoxSize + schemeUriSize + valueSize

	const writer = new IsoBoxWriteView(totalSize)
	writer.writeBoxHeader('kind', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUtf8TerminatedString(box.schemeUri)
	writer.writeUtf8TerminatedString(box.value)

	return writer
}
