import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeLegacyView } from '../cursor/writeLegacyView.ts'
import { encodeText } from '@svta/cml-utils'
import type { WebVttSourceLabelBox } from '../boxes/WebVttSourceLabelBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `vlab` box (`WebVttSourceLabelBox`).
 *
 * @param cursor - The write cursor
 * @param box - The `WebVttSourceLabelBox` fields to write
 *
 * @example
 * {@includeCode ../../test/writers/writeVlab.test.ts#example}
 *
 * @public
 */
export function writeVlab(cursor: IsoBoxWriteCursor, box: WebVttSourceLabelBox): void {
	const sourceLabelBytes = encodeText(box.sourceLabel)

	const headerSize = 8
	const sourceLabelSize = sourceLabelBytes.length
	const totalSize = headerSize + sourceLabelSize

	const writer = new IsoBoxWriteView('vlab', totalSize)
	writer.writeBytes(sourceLabelBytes)

	writeLegacyView(cursor, writer)
}
