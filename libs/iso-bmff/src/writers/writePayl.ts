import { encodeText } from '@svta/cml-utils'
import type { WebVttCuePayloadBox } from '../boxes/WebVttCuePayloadBox.ts'
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
export function writePayl(box: WebVttCuePayloadBox): IsoBoxWriteView {
	const cueTextBytes = encodeText(box.cueText)

	const headerSize = 8
	const cueTextSize = cueTextBytes.length + 1 // null-terminated
	const totalSize = headerSize + cueTextSize

	const writer = new IsoBoxWriteView('payl', totalSize)
	writer.writeUtf8TerminatedString(box.cueText)

	return writer
}
