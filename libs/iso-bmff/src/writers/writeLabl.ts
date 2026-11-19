import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeLegacyView } from '../cursor/writeLegacyView.ts'
import { encodeText } from '@svta/cml-utils'
import type { LabelBox } from '../boxes/LabelBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `labl` box (`LabelBox`).
 *
 * @param cursor - The write cursor
 * @param box - The `LabelBox` fields to write
 *
 * @example
 * {@includeCode ../../test/writers/writeLabl.test.ts#example}
 *
 * @public
 */
export function writeLabl(cursor: IsoBoxWriteCursor, box: LabelBox): void {
	const languageBytes = encodeText(box.language)
	const labelBytes = encodeText(box.label)

	const headerSize = 8
	const fullBoxSize = 4
	const labelIdSize = 2
	const languageSize = languageBytes.length + 1 // null-terminated
	const labelSize = labelBytes.length + 1 // null-terminated
	const totalSize = headerSize + fullBoxSize + labelIdSize + languageSize + labelSize

	const writer = new IsoBoxWriteView('labl', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.labelId, 2)
	writer.writeBytes(languageBytes)
	writer.writeUint(0, 1)
	writer.writeBytes(labelBytes)
	writer.writeUint(0, 1)

	writeLegacyView(cursor, writer)
}
