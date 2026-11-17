import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * An edit list entry.
 *
 * @public
 */
export type EditListEntry<V extends IsoInt64 = number> = {
	/** The duration of this edit in units of the `timescale` of the `mvhd` box. */
	segmentDuration: V
	/** The start time of this edit in units of the `timescale` of the `mdhd` box. The value -1 marks an empty edit. */
	mediaTime: V
	mediaRateInteger: number
	mediaRateFraction: number
}
