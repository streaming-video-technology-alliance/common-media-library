import type { TrackRunBox } from '../boxes/TrackRunBox.ts'
import type { TrackRunSample } from '../boxes/TrackRunSample.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readUint32 } from '../cursor/readUint32.ts'
import { readInt32 } from '../cursor/readInt32.ts'

/**
 * Read the `trun` box (`TrackRunBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.8.8
 *
 * The reader creates one object for each sample of `sample_count`. The reader sets no limit on that count.
 * If the box sets none of the flags 0x100 to 0x800, each object is empty and uses no bytes of the box.
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `TrackRunBox`
 *
 * @public
 */
export function readTrun(cursor: IsoBoxReadCursor<IsoInt64>): TrackRunBox {
	const version = readUint8(cursor)
	const flags = readUint24(cursor)
	const sampleCount = readUint32(cursor)
	const dataOffset = flags & 0x1 ? readInt32(cursor) : undefined
	const firstSampleFlags = flags & 0x4 ? readUint32(cursor) : undefined
	const samples: TrackRunSample[] = []

	for (let i = 0; i < sampleCount; i++) {
		const sample: TrackRunSample = {}

		if (flags & 0x100) {
			sample.sampleDuration = readUint32(cursor)
		}
		if (flags & 0x200) {
			sample.sampleSize = readUint32(cursor)
		}
		if (flags & 0x400) {
			sample.sampleFlags = readUint32(cursor)
		}
		if (flags & 0x800) {
			sample.sampleCompositionTimeOffset = version === 0 ? readUint32(cursor) : readInt32(cursor)
		}

		samples.push(sample)
	}

	return {
		type: 'trun',
		version,
		flags,
		dataOffset,
		firstSampleFlags,
		samples,
	}
}
