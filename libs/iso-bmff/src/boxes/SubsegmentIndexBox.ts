import type { FullBox } from './FullBox.ts'
import type { Subsegment } from './Subsegment.ts'

/**
 * Subsegment Index Box (`ssix`).
 *
 * ISO/IEC 14496-12:2015 - 8.16.4
 *
 * @public
 */
export type SubsegmentIndexBox = FullBox & {
	type: 'ssix'
	subsegmentCount: number
	subsegments: Subsegment[]
}
