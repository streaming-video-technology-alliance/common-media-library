import { CMCD_EVENT_RESPONSE_RECEIVED } from './CmcdEventType.ts'
import type { CmcdRequestLike } from './CmcdRequestLike.ts'
import type { CmcdResponseData } from './CmcdResponseData.ts'
import type { CmcdResponseInfo } from './CmcdResponseInfo.ts'
import { emitToEventTargets } from './emitToEventTargets.ts'
import type { RequestOrigin } from './RequestOrigin.ts'
import type { SessionState } from './SessionState.ts'
import { toResponseKeys } from './toResponseKeys.ts'

/**
 * Emits `rr` to every event target of the origin `sid` state that lists it.
 * The report merges the origin reporter's store, or its snapshot when that state has ended.
 * It then merges the `cid` at decoration, the copied per-request data, the derived keys, then `data`.
 */
export function emitResponse(session: SessionState, origin: RequestOrigin, request: CmcdRequestLike, info: CmcdResponseInfo, data: CmcdResponseData | undefined): void {
	const { sidState, reporter } = origin
	const derived = toResponseKeys(request, info, origin)
	const perCall: Record<string, unknown> = { ...(origin.cid !== undefined ? { cid: origin.cid } : {}), ...(origin.data ?? {}), ...derived, ...(data ?? {}) }
	const ts = typeof perCall['ts'] === 'number' ? perCall['ts'] : Date.now()
	delete perCall['ts']
	const store = sidState.ended ? (sidState.stores.get(reporter) ?? reporter.store) : reporter.store
	emitToEventTargets(session, sidState, reporter, CMCD_EVENT_RESPONSE_RECEIVED, perCall, request, ts, store, sidState.ended)
}
