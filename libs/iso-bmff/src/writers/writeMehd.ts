import type { Fields } from '../boxes/Fields.ts'
import type { MovieExtendsHeaderBox } from '../boxes/MovieExtendsHeaderBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a MovieExtendsHeaderBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 8.8.2 Movie Extends Header Box
 *
 * @param box - The MovieExtendsHeaderBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeMehd(box: Fields<MovieExtendsHeaderBox>): IsoBoxWriteView {
	const v1 = box.version === 1
	const size = v1 ? 8 : 4
	const headerSize = 8
	const fullBoxSize = 4
	const fragmentDurationSize = size
	const totalSize = headerSize + fullBoxSize + fragmentDurationSize

	const writer = new IsoBoxWriteView(totalSize)
	writer.writeBoxHeader('mehd', totalSize)
	writer.writeFullBox(box.version, box.flags)
	writer.writeUint(box.fragmentDuration, size)

	return writer
}
