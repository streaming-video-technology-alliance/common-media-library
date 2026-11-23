import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { TrackRunBox } from '../boxes/TrackRunBox.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { writeInt32 } from '../cursor/writeInt32.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `trun` box (`TrackRunBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.8.8
 *
 * @param cursor - The write cursor
 * @param box - The `TrackRunBox` fields to write
 *
 * @throws RangeError if a value of the box does not fit its field.
 *
 * @public
 */
export function writeTrun(cursor: IsoBoxWriteCursor, box: TrackRunBox): void {
	const { flags } = box
	const start = beginIsoFullBox(cursor, 'trun', box.version, flags)
	const writeCompositionTimeOffset = box.version ? writeInt32 : writeUint32

	writeUint32(cursor, box.samples.length)

	if (flags & 0x1) {
		writeInt32(cursor, box.dataOffset as number)
	}

	if (flags & 0x4) {
		writeUint32(cursor, box.firstSampleFlags as number)
	}

	for (const sample of box.samples) {
		if (flags & 0x100) {
			writeUint32(cursor, sample.sampleDuration as number)
		}
		if (flags & 0x200) {
			writeUint32(cursor, sample.sampleSize as number)
		}
		if (flags & 0x400) {
			writeUint32(cursor, sample.sampleFlags as number)
		}
		if (flags & 0x800) {
			writeCompositionTimeOffset(cursor, sample.sampleCompositionTimeOffset as number)
		}
	}

	endIsoBox(cursor, start)
}
