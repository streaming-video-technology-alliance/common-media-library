/**
 * The members of a `PerformanceResourceTiming` entry that `recordResponse()` reads.
 *
 * @public
 */
export type CmcdResourceTiming = {
	readonly startTime: number
	readonly responseStart?: number
	readonly responseEnd?: number
	readonly duration?: number
}
