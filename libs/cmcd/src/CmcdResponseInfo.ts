import type { CmcdResourceTiming } from './CmcdResourceTiming.ts'

/**
 * What the player knows about a response. Every member is optional.
 *
 * @public
 */
export type CmcdResponseInfo = {
	/** The HTTP status. `rc` is `0` when absent. */
	readonly status?: number
	readonly headers?: Headers | Readonly<Record<string, string>>
	readonly timing?: CmcdResourceTiming
}
