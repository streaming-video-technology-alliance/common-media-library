import { encodeText } from '@svta/cml-utils'
import type { WebVttSourceLabelBox } from '../boxes/WebVttSourceLabelBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `vlab` box (`WebVttSourceLabelBox`).
 *
 * @param box - The `WebVttSourceLabelBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @example
 * {@includeCode ../../test/writers/writeVlab.test.ts#example}
 *
 * @public
 */
export function writeVlab(box: WebVttSourceLabelBox): IsoBoxWriteView {
	const sourceLabelBytes = encodeText(box.sourceLabel)

	const headerSize = 8
	const sourceLabelSize = sourceLabelBytes.length
	const totalSize = headerSize + sourceLabelSize

	const writer = new IsoBoxWriteView('vlab', totalSize)
	writer.writeBytes(sourceLabelBytes)

	return writer
}
