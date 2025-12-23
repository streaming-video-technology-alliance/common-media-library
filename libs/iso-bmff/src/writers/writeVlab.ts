import { encodeText } from '@svta/cml-utils'
import type { Fields } from '../boxes/Fields.ts'
import type { WebVttSourceLabelBox } from '../boxes/WebVttSourceLabelBox.ts'
import { IsoDataWriter } from '../utils/IsoDataWriter.ts'

/**
 * Write a WebVttSourceLabelBox to an IsoDataWriter.
 *
 * @param box - The WebVttSourceLabelBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @beta
 */
export function writeVlab(box: Fields<WebVttSourceLabelBox>): IsoDataWriter {
	const sourceLabelBytes = encodeText(box.sourceLabel)

	const headerSize = 8
	const sourceLabelSize = sourceLabelBytes.length + 1 // null-terminated
	const totalSize = headerSize + sourceLabelSize

	const writer = new IsoDataWriter(totalSize)
	writer.writeBoxHeader('vlab', totalSize)
	writer.writeUtf8TerminatedString(box.sourceLabel)

	return writer
}
