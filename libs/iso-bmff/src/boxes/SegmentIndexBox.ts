import type { IsoInt64 } from '../IsoInt64.ts'
import type { FullBox } from './FullBox.ts'
import type { SegmentIndexReference } from './SegmentIndexReference.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.16.3 Segment Index Box
 *
 * @public
 */
export type SegmentIndexBox<V extends IsoInt64 = number> = FullBox & {
	type: 'sidx'
	referenceId: number
	timescale: number
	earliestPresentationTime: V
	firstOffset: V
	reserved: number
	references: SegmentIndexReference[]
}
