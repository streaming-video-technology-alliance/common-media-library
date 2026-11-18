import type { IsoInt64 } from '../IsoInt64.ts'
import type { FullBox } from './FullBox.ts'
import type { SegmentIndexReference } from './SegmentIndexReference.ts'

/**
 * Segment Index Box (`sidx`).
 *
 * ISO/IEC 14496-12:2015 - 8.16.3
 *
 * @public
 */
export type SegmentIndexBox<V extends IsoInt64 = number> = FullBox & {
	type: 'sidx'
	referenceId: number
	timescale: number
	earliestPresentationTime: V
	firstOffset: V
	references: SegmentIndexReference[]
}
