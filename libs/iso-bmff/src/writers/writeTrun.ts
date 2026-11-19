import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import { writeLegacyView } from '../cursor/writeLegacyView.ts'
import type { TrackRunBox } from '../boxes/TrackRunBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `trun` box (`TrackRunBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.8.8
 *
 * @param cursor - The write cursor
 * @param box - The `TrackRunBox` fields to write
 *
 * @public
 */
export function writeTrun(cursor: IsoBoxWriteCursor, box: TrackRunBox): void {
	const headerSize = 8
	const fullBoxSize = 4
	const sampleCountSize = 4
	const dataOffsetSize = box.flags & 0x1 ? 4 : 0
	const firstSampleFlagsSize = box.flags & 0x4 ? 4 : 0

	let sampleSize = 0
	if (box.flags & 0x100) sampleSize += 4 // sampleDuration
	if (box.flags & 0x200) sampleSize += 4 // sampleSize
	if (box.flags & 0x400) sampleSize += 4 // sampleFlags
	if (box.flags & 0x800) sampleSize += 4 // sampleCompositionTimeOffset

	const samplesSize = sampleSize * box.sampleCount
	const totalSize =
		headerSize + fullBoxSize + sampleCountSize + dataOffsetSize + firstSampleFlagsSize + samplesSize

	const writer = new IsoBoxWriteView('trun', totalSize)
	writer.writeFullBox(box.version, box.flags)

	writer.writeUint(box.sampleCount, 4)

	if (box.flags & 0x1) {
		writer.writeInt(box.dataOffset ?? 0, 4)
	}

	if (box.flags & 0x4) {
		writer.writeUint(box.firstSampleFlags ?? 0, 4)
	}

	const writeCompositionTimeOffset = box.version ? writer.writeInt : writer.writeUint

	for (const sample of box.samples) {
		if (box.flags & 0x100) {
			writer.writeUint(sample.sampleDuration ?? 0, 4)
		}
		if (box.flags & 0x200) {
			writer.writeUint(sample.sampleSize ?? 0, 4)
		}
		if (box.flags & 0x400) {
			writer.writeUint(sample.sampleFlags ?? 0, 4)
		}
		if (box.flags & 0x800) {
			writeCompositionTimeOffset(sample.sampleCompositionTimeOffset ?? 0, 4)
		}
	}

	writeLegacyView(cursor, writer)
}
