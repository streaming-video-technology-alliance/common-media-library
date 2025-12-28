import { encodeText } from '@svta/cml-utils'
import type { Fields } from '../boxes/Fields.ts'
import type { WebVttCueIdBox } from '../boxes/WebVttCueIdBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a WebVttCueIdBox to an IsoDataWriter.
 *
 * @param box - The WebVttCueIdBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeIden(box: Fields<WebVttCueIdBox>): IsoBoxWriteView {
	const cueIdBytes = encodeText(box.cueId)

	const headerSize = 8
	const cueIdSize = cueIdBytes.length + 1 // null-terminated
	const totalSize = headerSize + cueIdSize

	const writer = new IsoBoxWriteView(totalSize)
	writer.writeBoxHeader('iden', totalSize)
	writer.writeUtf8TerminatedString(box.cueId)

	return writer
}
