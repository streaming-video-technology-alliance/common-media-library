import type { CmcdPlaybackData } from './CmcdPlaybackData.ts'

/**
 * The data argument of `recordResponse()`: the playback data plus the response keys.
 * A supplied response key wins over the derived value for that report.
 *
 * @public
 */
export type CmcdResponseData = CmcdPlaybackData & {
	readonly ttfb?: number
	readonly ttlb?: number
	readonly ttfbb?: number
	readonly smrt?: string
	readonly cmsds?: string
	readonly cmsdd?: string
	readonly rc?: number
	readonly url?: string
}
