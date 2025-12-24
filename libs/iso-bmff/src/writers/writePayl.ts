import { encodeText } from '@svta/cml-utils'
import type { WebVttCuePayloadBox } from '../boxes/WebVttCuePayloadBox.ts'
import { IsoDataWriter } from '../utils/IsoDataWriter.ts'

/**
 * Write a WebVttCuePayloadBox to an IsoDataWriter.
 *
 * @param box - The WebVttCuePayloadBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @beta
 */
export function writePayl(box: WebVttCuePayloadBox): IsoDataWriter {
	const cueTextBytes = encodeText(box.cueText)

	const headerSize = 8
	const cueTextSize = cueTextBytes.length + 1 // null-terminated
	const totalSize = headerSize + cueTextSize

	const writer = new IsoDataWriter(totalSize)
	writer.writeBoxHeader('payl', totalSize)
	writer.writeUtf8TerminatedString(box.cueText)

	return writer
}
