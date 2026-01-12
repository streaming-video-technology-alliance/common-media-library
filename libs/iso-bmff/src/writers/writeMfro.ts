import type { MovieFragmentRandomAccessOffsetBox } from '../boxes/MovieFragmentRandomAccessOffsetBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a `MovieFragmentRandomAccessOffsetBox` to an `IsoBoxWriteView`.
 *
 * ISO/IEC 14496-12:2012 - 8.8.11 Movie Fragment Random Access Offset Box
 *
 * @param box - The `MovieFragmentRandomAccessOffsetBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the encoded box
 *
 * @public
 */
export function writeMfro(box: MovieFragmentRandomAccessOffsetBox): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4
	const mfraSizeSize = 4
	const totalSize = headerSize + fullBoxSize + mfraSizeSize

	const writer = new IsoBoxWriteView('mfro', totalSize)
	writer.writeFullBox(box.version, box.flags)
	writer.writeUint(box.mfraSize, 4)

	return writer
}
