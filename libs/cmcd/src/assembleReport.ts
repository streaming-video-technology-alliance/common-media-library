import { SfItem } from '@svta/cml-structured-field-values'
import { CMCD_V2 } from './CMCD_V2.ts'
import { CMCD_EVENT_MODE } from './CmcdReportingMode.ts'
import type { ReporterState } from './ReporterState.ts'
import type { SessionState } from './SessionState.ts'
import type { SidState } from './SidState.ts'
import type { TargetState } from './TargetState.ts'

/** The plain report before preparation, and the `bsd` causes it carries, for the commit step. */
export type AssembledReport = {
	readonly report: Record<string, unknown>
	readonly bsdCauses: readonly string[]
}

function pickLevel(bl: unknown, ot: unknown): number | undefined {
	if (typeof bl === 'number') {
		return bl
	}
	if (bl && typeof bl === 'object' && !Array.isArray(bl)) {
		const levels = bl as Record<string, unknown>
		const own = typeof ot === 'string' ? levels[ot] : undefined
		const first = Object.values(levels).find(value => typeof value === 'number')
		return typeof own === 'number' ? own : typeof first === 'number' ? first : undefined
	}
	return undefined
}

/** `dl` is `bl` divided by `pr`. The key table rounds it to 100 milliseconds. */
export function deriveDl(bl: unknown, pr: unknown, ot: unknown): number | undefined {
	const rate = typeof pr === 'number' ? pr : 1
	const level = pickLevel(bl, ot)
	return level !== undefined && Number.isFinite(level) && rate > 0 ? level / rate : undefined
}

/**
 * Merges, in this order and later wins: the store, the session data, the per-call data, the target's entry for the reporter,
 * the derived defaults, and the event stamp. `reporter` is `undefined` for a session-only interval line.
 * `store` replaces the reporter's store, for a response that reports under an ended `sid` state.
 */
export function assembleReport(session: SessionState, sidState: SidState, target: TargetState, reporter: ReporterState | undefined, event: string | undefined, data: Record<string, unknown> | undefined, ts: number, store?: Record<string, unknown>): AssembledReport {
	const config = session.config
	const report: Record<string, unknown> = { ...(store ?? reporter?.store ?? {}) }
	const bsdCauses: string[] = []

	report['sid'] = sidState.sid
	if (target.kind === CMCD_EVENT_MODE || config.version === CMCD_V2) {
		report['v'] = CMCD_V2
	}
	if (session.bg) {
		report['bg'] = true
	}
	if (sidState.msd !== undefined && !target.msdSent) {
		report['msd'] = sidState.msd
	}
	const bsa = sidState.bsaSupplied ?? (sidState.bsa > 0 ? sidState.bsa : undefined)
	if (bsa !== undefined) {
		report['bsa'] = bsa
	}
	const bsda = sidState.bsdaSupplied ?? (sidState.bsda > 0 ? sidState.bsda : undefined)
	if (bsda !== undefined) {
		report['bsda'] = bsda
	}
	const bsd: (number | SfItem<number, Record<string, boolean>>)[] = []
	for (const [cause, samples] of sidState.pending) {
		const cursor = target.bsdCursors.get(cause) ?? 0
		if (cursor < samples.length) {
			bsd.push(cause === '' ? samples[cursor] : new SfItem(samples[cursor], { [cause]: true }))
			bsdCauses.push(cause)
		}
	}
	if (bsd.length > 0) {
		report['bsd'] = bsd
	}
	if (target.kind === CMCD_EVENT_MODE && reporter?.host !== undefined && report['h'] === undefined) {
		report['h'] = reporter.host
	}

	if (data) {
		for (const [key, value] of Object.entries(data)) {
			if (value !== undefined) {
				report[key] = value
			}
		}
	}

	if (reporter) {
		const entry = target.entries.get(reporter)
		if (entry?.bs && report['bs'] === undefined) {
			report['bs'] = true
		}
		if (entry && entry.ec.length > 0 && report['ec'] === undefined) {
			report['ec'] = [...entry.ec]
		}
		if (config.derive.su && !reporter.suSupplied && report['su'] === undefined && reporter.su !== undefined) {
			report['su'] = reporter.su
		}
		if (config.derive.dl && !reporter.dlSupplied && report['dl'] === undefined) {
			const dl = deriveDl(report['bl'], report['pr'], report['ot'])
			if (dl !== undefined) {
				report['dl'] = dl
			}
		}
	}

	if (event !== undefined) {
		report['e'] = event
		report['ts'] = ts
	}
	return { report, bsdCauses }
}
