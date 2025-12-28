import type { Fields } from '../boxes/Fields.ts'
import type { MetaBox } from '../boxes/MetaBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a MetaBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 8.11.1 Meta Box
 *
 * @param box - The MetaBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeMeta(box: Fields<MetaBox>): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4
	const totalSize = headerSize + fullBoxSize

	const writer = new IsoBoxWriteView(totalSize)
	writer.writeBoxHeader('meta', totalSize)
	writer.writeFullBox(box.version, box.flags)

	return writer
}
