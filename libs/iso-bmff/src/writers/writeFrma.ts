import type { OriginalFormatBox } from '../boxes/OriginalFormatBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `frma` box (`OriginalFormatBox`).
 *
 * ISO/IEC 14496-12:2012 - 8.12.2 Original Format Box
 *
 * @param box - The `OriginalFormatBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
export function writeFrma(box: OriginalFormatBox): IsoBoxWriteView {
	const headerSize = 8
	const dataFormatSize = 4
	const totalSize = headerSize + dataFormatSize

	const writer = new IsoBoxWriteView('frma', totalSize)
	writer.writeUint(box.dataFormat, 4)

	return writer
}
