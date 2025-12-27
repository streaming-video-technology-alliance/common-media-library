import { encodeText } from '@svta/cml-utils'
import type { Fields } from '../boxes/types/Fields.ts'
import type { WebVttCuePayloadBox } from '../boxes/types/WebVttCuePayloadBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a WebVttCuePayloadBox to an IsoDataWriter.
 *
 * @param box - The WebVttCuePayloadBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writePayl(box: Fields<WebVttCuePayloadBox>): IsoBoxWriteView {
	const cueTextBytes = encodeText(box.cueText)

	const headerSize = 8
	const cueTextSize = cueTextBytes.length + 1 // null-terminated
	const totalSize = headerSize + cueTextSize

	const writer = new IsoBoxWriteView(totalSize)
	writer.writeBoxHeader('payl', totalSize)
	writer.writeUtf8TerminatedString(box.cueText)

	return writer
}
