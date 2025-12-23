import type { Fields } from '../boxes/Fields.ts'
import type { OriginalFormatBox } from '../boxes/OriginalFormatBox.ts'
import { IsoDataWriter } from '../utils/IsoDataWriter.ts'

/**
 * Write an OriginalFormatBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 8.12.2 Original Format Box
 *
 * @param box - The OriginalFormatBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @beta
 */
export function writeFrma(box: Fields<OriginalFormatBox>): IsoDataWriter {
	const headerSize = 8
	const dataFormatSize = 4
	const totalSize = headerSize + dataFormatSize

	const writer = new IsoDataWriter(totalSize)
	writer.writeBoxHeader('frma', totalSize)
	writer.writeUint(box.dataFormat, 4)

	return writer
}
