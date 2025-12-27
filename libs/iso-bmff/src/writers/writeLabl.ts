import { encodeText } from '@svta/cml-utils'
import type { Fields } from '../boxes/types/Fields.ts'
import type { LabelBox } from '../boxes/types/LabelBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a LabelBox to an IsoDataWriter.
 *
 * @param box - The LabelBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeLabl(box: Fields<LabelBox>): IsoBoxWriteView {
	const languageBytes = encodeText(box.language)
	const labelBytes = encodeText(box.label)

	const headerSize = 8
	const fullBoxSize = 4
	const labelIdSize = 2
	const languageSize = languageBytes.length + 1 // null-terminated
	const labelSize = labelBytes.length + 1 // null-terminated
	const totalSize = headerSize + fullBoxSize + labelIdSize + languageSize + labelSize

	const writer = new IsoBoxWriteView(totalSize)
	writer.writeBoxHeader('labl', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.labelId, 2)
	writer.writeUtf8TerminatedString(box.language)
	writer.writeUtf8TerminatedString(box.label)

	return writer
}
