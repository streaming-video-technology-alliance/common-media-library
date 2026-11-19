import type { SubsegmentIndexRange } from './SubsegmentIndexRange.ts'

/**
 * A subsegment of the Subsegment Index Box (`ssix`).
 *
 * @public
 */
export type SubsegmentIndexSubsegment = {
	ranges: SubsegmentIndexRange[]
}
