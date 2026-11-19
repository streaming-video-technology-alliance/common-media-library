import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeLegacyView } from '../cursor/writeLegacyView.ts'
import type { SampleSizeBox } from '../boxes/SampleSizeBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `stsz` box (`SampleSizeBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.3
 *
 * @param cursor - The write cursor
 * @param box - The `SampleSizeBox` fields to write
 *
 * @example
 * {@includeCode ../../test/writers/writeStsz.test.ts#example}
 *
 * @public
 */
export function writeStsz(cursor: IsoBoxWriteCursor, box: SampleSizeBox): void {
	const headerSize = 8
	const fullBoxSize = 4
	const sampleSizeFieldSize = 4
	const sampleCountFieldSize = 4
	const entrySizeSize = box.sampleSize === 0 ? box.sampleCount * 4 : 0
	const totalSize =
		headerSize + fullBoxSize + sampleSizeFieldSize + sampleCountFieldSize + entrySizeSize

	const writer = new IsoBoxWriteView('stsz', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.sampleSize, 4)
	writer.writeUint(box.sampleCount, 4)

	if (box.sampleSize === 0 && box.entrySize) {
		for (const size of box.entrySize) {
			writer.writeUint(size, 4)
		}
	}

	writeLegacyView(cursor, writer)
}
