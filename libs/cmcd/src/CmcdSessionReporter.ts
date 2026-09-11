import type { CmcdDecoratedRequest } from './CmcdDecoratedRequest.ts'
import type { CmcdDiscreteEventType } from './CmcdDiscreteEventType.ts'
import type { CmcdPlaybackData } from './CmcdPlaybackData.ts'
import type { CmcdRequestLike } from './CmcdRequestLike.ts'
import type { CmcdResponseData } from './CmcdResponseData.ts'
import type { CmcdResponseInfo } from './CmcdResponseInfo.ts'
import type { CmcdSession } from './CmcdSession.ts'

/**
 * Reports for one media player inside a `CmcdSession`.
 *
 * @public
 */
export type CmcdSessionReporter = {
	readonly session: CmcdSession
	/** Merges `data` into the store and emits the state-change events it implies. */
	update(data: CmcdPlaybackData): void
	/** Emits one discrete event. */
	recordEvent(type: Exclude<CmcdDiscreteEventType, 'ce'>, data?: CmcdPlaybackData): void
	recordEvent(type: 'ce', data: CmcdPlaybackData & { readonly cen: string }): void
	/** Buffers error codes per destination and emits an `e` event. */
	recordError(code: string | readonly string[], data?: CmcdPlaybackData): void
	/** Returns a copy of `request` with the request-mode report placed on it. */
	decorate<R extends CmcdRequestLike>(request: R, data?: CmcdPlaybackData): CmcdDecoratedRequest<R>
	/** Emits an `rr` event for a response. Pass the request returned by `decorate()`. */
	recordResponse(request: CmcdRequestLike, response: CmcdResponseInfo, data?: CmcdResponseData): void
	dispose(): void
}
