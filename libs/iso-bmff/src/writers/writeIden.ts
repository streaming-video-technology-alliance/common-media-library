import { encodeText } from '@svta/cml-utils'
import type { WebVttCueIdBox } from '../boxes/WebVttCueIdBox.ts'
import { IsoDataWriter } from '../utils/IsoDataWriter.ts'

/**
 * Write a WebVttCueIdBox to an IsoDataWriter.
 *
 * @param box - The WebVttCueIdBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @beta
 */
export function writeIden(box: WebVttCueIdBox): IsoDataWriter {
	const cueIdBytes = encodeText(box.cueId)

	const headerSize = 8
	const cueIdSize = cueIdBytes.length + 1 // null-terminated
	const totalSize = headerSize + cueIdSize

	const writer = new IsoDataWriter(totalSize)
	writer.writeBoxHeader('iden', totalSize)
	writer.writeUtf8TerminatedString(box.cueId)

	return writer
}
