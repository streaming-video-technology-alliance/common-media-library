import { CMCD_V2 } from './CMCD_V2.ts'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdEventTransform } from './CmcdEventTransform.ts'
import { CMCD_EVENT_MODE } from './CmcdReportingMode.ts'
import type { CmcdRequestLike } from './CmcdRequestLike.ts'
import type { AssembledReport } from './assembleReport.ts'
import { encodePreparedCmcd } from './encodePreparedCmcd.ts'
import { filterReport, isRequired } from './filterReport.ts'
import { getKeySpec } from './getKeySpec.ts'
import { normalizeReport } from './normalizeReport.ts'
import type { PrepareContext } from './PrepareContext.ts'
import { pruneSpans } from './pruneSpans.ts'
import type { ReporterState } from './ReporterState.ts'
import type { SessionState } from './SessionState.ts'
import type { SidState } from './SidState.ts'
import type { TargetState } from './TargetState.ts'

/** The prepared report and its encoded line. */
export type EmittedReport = {
	readonly prepared: Record<string, unknown>
	readonly line: string
}

/**
 * Normalizes, transforms, filters, encodes, and commits one report for one target.
 * Returns `undefined` when the transform cancels. An encoder error propagates and commits nothing.
 */
export function emitReport(session: SessionState, sidState: SidState, target: TargetState, reporter: ReporterState | undefined, assembled: AssembledReport, event: string | undefined, request: Readonly<CmcdRequestLike> | undefined): EmittedReport | undefined {
	const config = session.config
	const targetConfig = target.kind === CMCD_EVENT_MODE ? config.eventTargets[target.index] : undefined
	const context: PrepareContext = {
		version: targetConfig ? CMCD_V2 : config.version,
		mode: target.kind,
		event,
		keys: targetConfig ? targetConfig.keys : config.keys,
		baseUrl: request?.url,
	}
	let normalized = normalizeReport(assembled.report, context)
	const transform = targetConfig ? targetConfig.transform : config.transform
	if (transform) {
		const before = normalized
		const result = (transform as CmcdEventTransform)(before as Cmcd, request)
		if (result === null) {
			return undefined
		}
		normalized = normalizeReport(result as Record<string, unknown>, context)
		for (const key of Object.keys(before)) {
			const spec = getKeySpec(key)
			if (spec && isRequired(spec, event) && normalized[key] === undefined) {
				normalized[key] = before[key]
			}
		}
		normalized['sid'] = before['sid']
		if (event !== undefined) {
			normalized['e'] = before['e']
			normalized['ts'] = before['ts']
		}
	}
	normalized['sn'] = target.sn
	const prepared = filterReport(normalized, context)
	const line = encodePreparedCmcd(prepared as Cmcd)

	target.sn += 1
	if (prepared['msd'] !== undefined) {
		target.msdSent = true
	}
	if (reporter) {
		const entry = target.entries.get(reporter)
		if (entry) {
			entry.ec.length = 0
			if (reporter.store['sta'] !== 'r') {
				entry.bs = false
			}
		}
	}
	if (prepared['bsd'] !== undefined) {
		for (const cause of assembled.bsdCauses) {
			target.bsdCursors.set(cause, (target.bsdCursors.get(cause) ?? 0) + 1)
		}
		pruneSpans(session, sidState)
	}
	if (targetConfig) {
		target.queue.push(line)
		if (target.queue.length > targetConfig.maxQueueSize) {
			target.queue.splice(0, target.queue.length - targetConfig.maxQueueSize)
		}
	}
	return { prepared, line }
}
