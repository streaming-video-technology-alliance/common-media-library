import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeLegacyView } from '../cursor/writeLegacyView.ts'
import { encodeText } from '@svta/cml-utils'
import type { WebVttCueIdBox } from '../boxes/WebVttCueIdBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `iden` box (`WebVttCueIdBox`).
 *
 * @param cursor - The write cursor
 * @param box - The `WebVttCueIdBox` fields to write
 *
 * @example
 * {@includeCode ../../test/writers/writeIden.test.ts#example}
 *
 * @public
 */
export function writeIden(cursor: IsoBoxWriteCursor, box: WebVttCueIdBox): void {
	const cueIdBytes = encodeText(box.cueId)

	const headerSize = 8
	const cueIdSize = cueIdBytes.length
	const totalSize = headerSize + cueIdSize

	const writer = new IsoBoxWriteView('iden', totalSize)
	writer.writeBytes(cueIdBytes)

	writeLegacyView(cursor, writer)
}
