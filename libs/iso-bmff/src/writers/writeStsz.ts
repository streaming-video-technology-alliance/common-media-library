import type { SampleSizeBox } from '../boxes/SampleSizeBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a `SampleSizeBox` to an `IsoBoxWriteView`.
 *
 * ISO/IEC 14496-12:2012 - 8.7.3 Sample Size Box
 *
 * @param box - The `SampleSizeBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the encoded box
 *
 * @public
 */
export function writeStsz(box: SampleSizeBox): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4
	const sampleSizeFieldSize = 4
	const sampleCountFieldSize = 4
	const entrySizeSize = box.sampleSize === 0 ? box.sampleCount * 4 : 0
	const totalSize = headerSize + fullBoxSize + sampleSizeFieldSize + sampleCountFieldSize + entrySizeSize

	const writer = new IsoBoxWriteView('stsz', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.sampleSize, 4)
	writer.writeUint(box.sampleCount, 4)

	if (box.sampleSize === 0 && box.entrySize) {
		for (const size of box.entrySize) {
			writer.writeUint(size, 4)
		}
	}

	return writer
}
