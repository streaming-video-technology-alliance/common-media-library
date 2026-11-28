import type { IsoBoxReadCursor } from '../IsoBoxReadCursor.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import type { SubsegmentIndexBox } from '../boxes/SubsegmentIndexBox.ts'
import { readUint8 } from '../cursor/readUint8.ts'
import { readUint24 } from '../cursor/readUint24.ts'
import { readUint32 } from '../cursor/readUint32.ts'
import type { SubsegmentIndexRange } from '../boxes/SubsegmentIndexRange.ts'
import type { SubsegmentIndexSubsegment } from '../boxes/SubsegmentIndexSubsegment.ts'

/**
 * Read the `ssix` box (`SubsegmentIndexBox`).
 *
 * @param cursor - The read cursor at the first byte after the box header
 *
 * @returns A parsed `SubsegmentIndexBox`
 *
 * @public
 */
export function readSsix(cursor: IsoBoxReadCursor<IsoInt64>): SubsegmentIndexBox {
	const version = readUint8(cursor)
	const flags = readUint24(cursor)
	const subsegmentCount = readUint32(cursor)
	const subsegments: SubsegmentIndexSubsegment[] = []

	for (let i = 0; i < subsegmentCount; i++) {
		const rangesCount = readUint32(cursor)
		const ranges: SubsegmentIndexRange[] = []

		for (let j = 0; j < rangesCount; j++) {
			ranges.push({
				level: readUint8(cursor),
				rangeSize: readUint24(cursor),
			})
		}

		subsegments.push({ ranges })
	}

	return {
		type: 'ssix',
		version,
		flags,
		subsegments,
	}
}
