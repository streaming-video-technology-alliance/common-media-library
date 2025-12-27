import { encodeText } from '@svta/cml-utils'
import type { Fields } from '../boxes/types/Fields.ts'
import type { WebVttSourceLabelBox } from '../boxes/types/WebVttSourceLabelBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a WebVttSourceLabelBox to an IsoDataWriter.
 *
 * @param box - The WebVttSourceLabelBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeVlab(box: Fields<WebVttSourceLabelBox>): IsoBoxWriteView {
	const sourceLabelBytes = encodeText(box.sourceLabel)

	const headerSize = 8
	const sourceLabelSize = sourceLabelBytes.length + 1 // null-terminated
	const totalSize = headerSize + sourceLabelSize

	const writer = new IsoBoxWriteView(totalSize)
	writer.writeBoxHeader('vlab', totalSize)
	writer.writeUtf8TerminatedString(box.sourceLabel)

	return writer
}
