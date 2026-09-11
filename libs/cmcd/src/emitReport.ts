import { SfToken } from '@svta/cml-structured-field-values'
import { CMCD_V2 } from './CMCD_V2.ts'
import type { Cmcd } from './Cmcd.ts'
import type { CmcdEventTransform } from './CmcdEventTransform.ts'
import { CMCD_EVENT_MODE } from './CmcdReportingMode.ts'
import type { CmcdRequestLike } from './CmcdRequestLike.ts'
import type { AssembledReport } from './assembleReport.ts'
import { encodePreparedCmcd } from './encodePreparedCmcd.ts'
import { getKeySpec } from './getKeySpec.ts'
import { normalizeValue, toTokenText } from './normalizeValue.ts'
import type { PrepareContext } from './PrepareContext.ts'
import { isRequired, prepareReport } from './prepareReport.ts'
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
 * Shallow-copies an object value, keeping its prototype for a later `instanceof` check.
 * Also copies a `params` record, so a transform cannot mutate it by reference.
 */
function copyNestedValue(value: unknown): unknown {
	if (value === null || typeof value !== 'object') {
		return value
	}
	const copy = Object.assign(Object.create(Object.getPrototypeOf(value)), value) as { params?: unknown }
	if (copy.params !== null && typeof copy.params === 'object') {
		copy.params = { ...copy.params }
	}
	return copy
}

/**
 * A token key's plain text, matching its declared `Cmcd` type.
 * Every other value is a copy, so a transform cannot mutate it by reference.
 * This stops a transform from corrupting the store or another target's report.
 * A shared `SfItem`, its `params`, or an inner-list item can no longer leak a mutation.
 */
function toTransformView(normalized: Record<string, unknown>): Record<string, unknown> {
	const view: Record<string, unknown> = {}
	for (const key of Object.keys(normalized)) {
		const value = normalized[key]
		if (value instanceof SfToken && getKeySpec(key)?.type === 'token') {
			view[key] = value.description
		}
		else if (Array.isArray(value)) {
			view[key] = value.map(copyNestedValue)
		}
		else {
			view[key] = copyNestedValue(value)
		}
	}
	return view
}

/** Names the stage and the target in a report error. The original error becomes `cause`. */
function fail(stage: 'transform' | 'encode', targetName: string, error: unknown): Error {
	const detail = error instanceof Error ? error.message : String(error)
	return new Error(`CmcdSession: ${stage} failed for target ${targetName}: ${detail}`, { cause: error })
}

/**
 * Runs the configured transform on the report and returns the report to prepare. The transform sees every key
 * in structured-field form, before the allowlist and the spec rules apply. A required key the transform removed
 * or broke is restored, and `sid`, `e`, and `ts` are re-stamped. Returns `undefined` when the transform cancels.
 */
function applyTransform(transform: CmcdEventTransform, report: Record<string, unknown>, context: PrepareContext, event: string | undefined, request: Readonly<CmcdRequestLike> | undefined, targetName: string): Record<string, unknown> | undefined {
	const before = prepareReport(report, context, false)
	let result: Cmcd | null
	try {
		result = transform(toTransformView(before) as Cmcd, request)
	}
	catch (error) {
		throw fail('transform', targetName, error)
	}
	// A nullish result cancels the report, as the transforms RFC states. A forgotten `return` therefore cancels too.
	if (result == null) {
		return undefined
	}
	// A copy, so the reporter-owned keys never reach an object the transform may keep.
	const merged: Record<string, unknown> = { ...result }
	const ot = toTokenText(merged['ot'])
	for (const key of Object.keys(before)) {
		const spec = getKeySpec(key)
		if (spec && isRequired(spec, event) && normalizeValue(merged[key], spec, context, ot) === undefined) {
			merged[key] = before[key]
		}
	}
	merged['sid'] = before['sid']
	if (event !== undefined) {
		merged['e'] = before['e']
		merged['ts'] = before['ts']
	}
	return merged
}

/**
 * Prepares, transforms, encodes, and commits one report for one target. The report is normalized and filtered in
 * one pass. Returns `undefined` when the transform cancels. A transform or encoder error propagates as a wrapped
 * `Error` and commits nothing.
 */
export function emitReport(session: SessionState, sidState: SidState, target: TargetState, reporter: ReporterState | undefined, assembled: AssembledReport, event: string | undefined, request: Readonly<CmcdRequestLike> | undefined): EmittedReport | undefined {
	const config = session.config
	const targetConfig = target.kind === CMCD_EVENT_MODE ? config.eventTargets[target.index] : undefined
	const targetName = targetConfig ? targetConfig.url : 'request'
	const context: PrepareContext = {
		version: targetConfig ? CMCD_V2 : config.version,
		mode: target.kind,
		event,
		keys: targetConfig ? targetConfig.keys : config.keys,
		baseUrl: request?.url,
	}
	const transform = targetConfig ? targetConfig.transform : config.transform
	let report: Record<string, unknown> | undefined = assembled.report
	if (transform) {
		report = applyTransform(transform as CmcdEventTransform, report, context, event, request, targetName)
		if (report === undefined) {
			return undefined
		}
	}
	// The sequence number is assigned after the transform and before preparation, so the output stays in key order.
	report['sn'] = target.sn
	const prepared = prepareReport(report, context, true)
	let line: string
	try {
		line = encodePreparedCmcd(prepared as Cmcd)
	}
	catch (error) {
		throw fail('encode', targetName, error)
	}

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
