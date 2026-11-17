import { encodeText } from '@svta/cml-utils'
import type { WebVttCueIdBox } from '../boxes/WebVttCueIdBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `iden` box (`WebVttCueIdBox`).
 *
 * @param box - The `WebVttCueIdBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
export function writeIden(box: WebVttCueIdBox): IsoBoxWriteView {
	const cueIdBytes = encodeText(box.cueId)

	const headerSize = 8
	const cueIdSize = cueIdBytes.length
	const totalSize = headerSize + cueIdSize

	const writer = new IsoBoxWriteView('iden', totalSize)
	writer.writeBytes(cueIdBytes)

	return writer
}
