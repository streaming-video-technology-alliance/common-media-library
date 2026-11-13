import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * An edit list entry.
 *
 * @public
 */
export type EditListEntry<V extends IsoInt64 = number> = {
	segmentDuration: V
	mediaTime: V
	mediaRateInteger: number
	mediaRateFraction: number
}
