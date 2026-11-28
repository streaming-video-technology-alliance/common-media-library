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
 * Each object has the four sample fields in the same order. A field that the flags exclude is `undefined`.
 * If the box sets none of the flags 0x100 to 0x800, the objects use no bytes of the box.
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
	const hasDuration = (flags & 0x100) !== 0
	const hasSize = (flags & 0x200) !== 0
	const hasFlags = (flags & 0x400) !== 0
	const hasOffset = (flags & 0x800) !== 0
	const readOffset = version === 0 ? readUint32 : readInt32
	const samples: TrackRunSample[] = new Array<TrackRunSample>(sampleCount)

	for (let i = 0; i < sampleCount; i++) {
		samples[i] = {
			sampleDuration: hasDuration ? readUint32(cursor) : undefined,
			sampleSize: hasSize ? readUint32(cursor) : undefined,
			sampleFlags: hasFlags ? readUint32(cursor) : undefined,
			sampleCompositionTimeOffset: hasOffset ? readOffset(cursor) : undefined,
		}
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
