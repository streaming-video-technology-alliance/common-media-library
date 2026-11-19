import type { SubSampleInformationBox } from '../boxes/SubSampleInformationBox.ts'
import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readUint16 } from '../cursor/readUint16.ts'
import { readUint32 } from '../cursor/readUint32.ts'
import type { SubSampleInformationEntry } from '../boxes/SubSampleInformationEntry.ts'
import type { SubSampleInformationSubsample } from '../boxes/SubSampleInformationSubsample.ts'

/**
 * Read the `subs` box (`SubSampleInformationBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `SubSampleInformationBox`
 *
 * @public
 */
export function readSubs(cursor: IsoBoxReadCursor<IsoInt64>): SubSampleInformationBox {
	const version = readUint8(cursor)
	const flags = readUint24(cursor)
	const readSubsampleSize = version === 1 ? readUint32 : readUint16
	const entryCount = readUint32(cursor)
	const entries: SubSampleInformationEntry[] = []

	for (let i = 0; i < entryCount; i++) {
		const sampleDelta = readUint32(cursor)
		const subsampleCount = readUint16(cursor)
		const subsamples: SubSampleInformationSubsample[] = []

		for (let j = 0; j < subsampleCount; j++) {
			subsamples.push({
				subsampleSize: readSubsampleSize(cursor),
				subsamplePriority: readUint8(cursor),
				discardable: readUint8(cursor),
				codecSpecificParameters: readUint32(cursor),
			})
		}

		entries.push({ sampleDelta, subsamples })
	}

	return {
		type: 'subs',
		version,
		flags,
		entries,
	}
}
