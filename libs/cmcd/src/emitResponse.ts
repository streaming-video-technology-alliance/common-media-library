import { CMCD_EVENT_RESPONSE_RECEIVED } from './CmcdEventType.ts'
import type { CmcdRequestLike } from './CmcdRequestLike.ts'
import type { CmcdResponseData } from './CmcdResponseData.ts'
import type { CmcdResponseInfo } from './CmcdResponseInfo.ts'
import { assembleReport } from './assembleReport.ts'
import { emitReport } from './emitReport.ts'
import { processQueue } from './processQueue.ts'
import type { RequestOrigin } from './RequestOrigin.ts'
import type { SessionState } from './SessionState.ts'
import type { TargetState } from './TargetState.ts'
import { toResponseKeys } from './toResponseKeys.ts'

/**
 * Emits `rr` to every event target of the origin `sid` state that lists it. The report merges the origin reporter's store,
 * or the copy the ended `sid` state keeps, the `cid` at decoration, the copied per-request data, the derived keys, then `data`.
 */
export function emitResponse(session: SessionState, origin: RequestOrigin, request: CmcdRequestLike, info: CmcdResponseInfo, data: CmcdResponseData | undefined): void {
	const { sidState, reporter } = origin
	const derived = toResponseKeys(request, info, origin)
	const perCall: Record<string, unknown> = { ...(origin.data ?? {}), ...derived, ...(data ?? {}) }
	if (origin.cid !== undefined && data?.cid === undefined) {
		perCall['cid'] = origin.cid
	}
	const ts = typeof perCall['ts'] === 'number' ? perCall['ts'] : Date.now()
	delete perCall['ts']
	const store = sidState.ended ? (sidState.stores.get(reporter) ?? reporter.store) : reporter.store
	const targets: TargetState[] = []
	let failure: unknown
	let failed = false
	for (const target of sidState.eventTargets) {
		if (target.gone || !session.config.eventTargets[target.index].events.has(CMCD_EVENT_RESPONSE_RECEIVED)) {
			continue
		}
		try {
			const assembled = assembleReport(session, sidState, target, reporter, CMCD_EVENT_RESPONSE_RECEIVED, perCall, ts, store)
			emitReport(session, sidState, target, reporter, assembled, CMCD_EVENT_RESPONSE_RECEIVED, request)
			targets.push(target)
		}
		catch (error) {
			if (!failed) {
				failed = true
				failure = error
			}
		}
	}
	for (const target of targets) {
		processQueue(session, sidState, target, sidState.ended)
	}
	if (failed) {
		throw failure
	}
}
