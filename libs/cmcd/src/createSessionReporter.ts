import type { Cmcd } from './Cmcd.ts'
import { CMCD_REQUEST_ORIGINS } from './CMCD_REQUEST_ORIGINS.ts'
import type { CmcdDecoratedRequest } from './CmcdDecoratedRequest.ts'
import type { CmcdDiscreteEventType } from './CmcdDiscreteEventType.ts'
import { CMCD_EVENT_ERROR } from './CmcdEventType.ts'
import type { CmcdPlaybackData } from './CmcdPlaybackData.ts'
import type { CmcdRequestLike } from './CmcdRequestLike.ts'
import type { CmcdRequestRecord } from './CmcdRequestRecord.ts'
import type { CmcdSession } from './CmcdSession.ts'
import type { CmcdSessionReporter } from './CmcdSessionReporter.ts'
import type { CmcdSessionReporterConfig } from './CmcdSessionReporterConfig.ts'
import { assembleReport } from './assembleReport.ts'
import { checkCid, configError } from './checkRequestSettings.ts'
import { copyPlaybackData } from './copyPlaybackData.ts'
import { deriveStateEvents } from './deriveStateEvents.ts'
import { emitEvent } from './emitEvent.ts'
import { emitReport } from './emitReport.ts'
import { getTargetEntry } from './getTargetEntry.ts'
import { placeRequestReport } from './placeRequestReport.ts'
import type { ReporterState } from './ReporterState.ts'
import type { RequestOrigin } from './RequestOrigin.ts'
import type { SessionState } from './SessionState.ts'
import type { SidState } from './SidState.ts'

const SESSION_FACTS = ['bg', 'msd', 'bsa', 'bsda', 'bsd'] as const

function writeSessionFact(state: SessionState, sidState: SidState, key: typeof SESSION_FACTS[number], value: unknown): void {
	if (key === 'bg') {
		state.bg = value === true ? true : undefined
		state.bgSupplied = true
		state.stopVisibility?.()
		state.stopVisibility = undefined
	}
	else if (key === 'msd') {
		sidState.msd = typeof value === 'number' ? value : undefined
		sidState.msdSupplied = true
	}
	else if (key === 'bsa') {
		sidState.bsaSupplied = value as SidState['bsaSupplied']
	}
	else if (key === 'bsda') {
		sidState.bsdaSupplied = value as SidState['bsdaSupplied']
	}
	else {
		sidState.bsdSupplied = true
		const samples = typeof value === 'number' ? { '': value } : (value ?? {}) as Record<string, number>
		for (const [cause, duration] of Object.entries(samples)) {
			if (typeof duration === 'number' && Number.isFinite(duration)) {
				let list = sidState.pending.get(cause)
				if (!list) {
					list = []
					sidState.pending.set(cause, list)
				}
				list.push(duration)
			}
		}
	}
}

/** Merges `data` into the store. Session facts go to the session or the `sid` state. Returns the transition time. */
export function mergeUpdate(state: SessionState, reporter: ReporterState, data: CmcdPlaybackData): number {
	const sidState = state.current
	const ts = typeof data.ts === 'number' ? data.ts : Date.now()
	for (const [key, value] of Object.entries(data)) {
		if (key === 'ts') {
			continue
		}
		if ((SESSION_FACTS as readonly string[]).includes(key)) {
			writeSessionFact(state, sidState, key as typeof SESSION_FACTS[number], value)
			continue
		}
		if (value === undefined) {
			Reflect.deleteProperty(reporter.store, key)
		}
		else {
			reporter.store[key] = value
		}
		if (key === 'su') {
			reporter.suSupplied = true
		}
		if (key === 'dl') {
			reporter.dlSupplied = true
		}
		if (key === 'h') {
			reporter.hSupplied = true
		}
	}
	return ts
}

function finish<R extends CmcdRequestLike>(request: R, placed: { url: string; headers: Record<string, string> | undefined }, record: CmcdRequestRecord): CmcdDecoratedRequest<R> {
	const decorated: Record<string, unknown> = { ...request, url: placed.url, cmcd: record }
	if (placed.headers) {
		decorated['headers'] = placed.headers
	}
	else {
		delete decorated['headers']
	}
	return decorated as CmcdDecoratedRequest<R>
}

/** One reporter of a session, with its own store and its own entry in every target. */
export function createSessionReporter(state: SessionState, session: CmcdSession, config: CmcdSessionReporterConfig = {}): CmcdSessionReporter {
	if (state.disposed) {
		throw configError('createReporter', 'a live session', 'a disposed session')
	}
	if (config.cid !== undefined) {
		checkCid(config.cid)
	}
	const reporter: ReporterState = {
		session: state,
		store: config.cid === undefined ? {} : { cid: config.cid },
		reported: { cid: config.cid },
		host: undefined,
		hSupplied: false,
		su: undefined,
		suSupplied: false,
		dlSupplied: false,
		spanOpenedAt: undefined,
		disposed: false,
	}
	state.reporters.add(reporter)

	const facade: CmcdSessionReporter = {
		session,
		update(data) {
			if (reporter.disposed || state.disposed) {
				return
			}
			const ts = mergeUpdate(state, reporter, data)
			deriveStateEvents(state, reporter, ts)
		},
		recordEvent(type: CmcdDiscreteEventType, data?: CmcdPlaybackData) {
			if (reporter.disposed || state.disposed) {
				return
			}
			emitEvent(state, reporter, type, data, undefined, typeof data?.ts === 'number' ? data.ts : Date.now())
		},
		recordError(code, data) {
			if (reporter.disposed || state.disposed) {
				return
			}
			const codes = (typeof code === 'string' ? [code] : [...code]).filter(item => item !== '')
			const sidState = state.current
			for (const target of [sidState.requestTarget, ...sidState.eventTargets]) {
				getTargetEntry(target, reporter).ec.push(...codes)
			}
			emitEvent(state, reporter, CMCD_EVENT_ERROR, data, undefined, typeof data?.ts === 'number' ? data.ts : Date.now())
		},
		decorate<R extends CmcdRequestLike>(request: R, data?: CmcdPlaybackData): CmcdDecoratedRequest<R> {
			const sidState = state.current
			const mode = state.config.transmissionMode
			if (reporter.disposed || state.disposed) {
				const placed = placeRequestReport(request, undefined, mode, state.config.headerMap)
				return finish(request, placed, { sid: sidState.sid, data: {} })
			}
			const dataCopy = copyPlaybackData(data)
			const origin: RequestOrigin = { reporter, sidState, cid: reporter.store['cid'] as string | undefined, data: dataCopy, startedAt: Date.now() }
			const assembled = assembleReport(state, sidState, sidState.requestTarget, reporter, undefined, dataCopy, origin.startedAt)
			const emitted = emitReport(state, sidState, sidState.requestTarget, reporter, assembled, undefined, request)
			const placed = placeRequestReport(request, emitted, mode, state.config.headerMap)
			const record: CmcdRequestRecord = { sid: sidState.sid, data: (emitted?.prepared ?? {}) as Readonly<Cmcd> }
			CMCD_REQUEST_ORIGINS.set(record, origin)
			return finish(request, placed, record)
		},
		recordResponse() {
			// Event mode delivery is not implemented yet.
		},
		dispose() {
			reporter.disposed = true
			state.reporters.delete(reporter)
			for (const target of [state.current.requestTarget, ...state.current.eventTargets]) {
				target.entries.delete(reporter)
			}
		},
	}
	return facade
}
