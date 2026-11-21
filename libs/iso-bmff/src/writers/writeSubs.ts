import type { IsoBoxWriteCursor } from '../IsoBoxWriteCursor.ts'
import type { SubSampleInformationBox } from '../boxes/SubSampleInformationBox.ts'
import { beginIsoFullBox } from '../beginIsoFullBox.ts'
import { writeUint8 } from '../cursor/writeUint8.ts'
import { writeUint16 } from '../cursor/writeUint16.ts'
import { writeUint32 } from '../cursor/writeUint32.ts'
import { endIsoBox } from '../endIsoBox.ts'

/**
 * Write the `subs` box (`SubSampleInformationBox`).
 *
 * ISO/IEC 14496-12:2015 - 8.7.7
 *
 * @param cursor - The write cursor
 * @param box - The `SubSampleInformationBox` fields to write
 *
 * @throws RangeError if an entry has more than 65535 subsamples.
 *
 * @public
 */
export function writeSubs(cursor: IsoBoxWriteCursor, box: SubSampleInformationBox): void {
	const start = beginIsoFullBox(cursor, 'subs', box.version, box.flags)
	const writeSubsampleSize = box.version === 1 ? writeUint32 : writeUint16

	writeUint32(cursor, box.entries.length)

	for (const { sampleDelta, subsamples } of box.entries) {
		if (subsamples.length > 0xffff) {
			throw new RangeError(
				`The subs box has ${subsamples.length} subsamples in one entry, and the limit is 65535`,
			)
		}

		writeUint32(cursor, sampleDelta)
		writeUint16(cursor, subsamples.length)

		for (const subsample of subsamples) {
			writeSubsampleSize(cursor, subsample.subsampleSize)
			writeUint8(cursor, subsample.subsamplePriority)
			writeUint8(cursor, subsample.discardable)
			writeUint32(cursor, subsample.codecSpecificParameters)
		}
	}

	endIsoBox(cursor, start)
}
