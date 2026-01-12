import { encodeText } from '@svta/cml-utils'
import type { LabelBox } from '../boxes/LabelBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a `LabelBox` to an `IsoBoxWriteView`.
 *
 * @param box - The `LabelBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the encoded box
 *
 * @public
 */
export function writeLabl(box: LabelBox): IsoBoxWriteView {
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
	writer.writeUtf8TerminatedString(box.language)
	writer.writeUtf8TerminatedString(box.label)

	return writer
}
