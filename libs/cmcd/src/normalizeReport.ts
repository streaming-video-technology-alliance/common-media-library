import { formatNor } from './formatNor.ts'
import { getKeySpec } from './getKeySpec.ts'
import { normalizeValue, toTokenText } from './normalizeValue.ts'
import type { PrepareContext } from './PrepareContext.ts'
import { CMCD_EVENT_MODE } from './CmcdReportingMode.ts'

/** Plain report values to structured-field values, in sorted key order. Keys of the other mode and version 1 drops are removed. */
export function normalizeReport(report: Record<string, unknown>, context: PrepareContext): Record<string, unknown> {
	const out: Record<string, unknown> = {}
	const reportOt = toTokenText(report['ot'])
	for (const key of Object.keys(report).sort()) {
		const spec = getKeySpec(key)
		const value = report[key]
		if (!spec || value === undefined || value === null) {
			continue
		}
		if (spec.modes === 'event' && context.mode !== CMCD_EVENT_MODE) {
			continue
		}
		if (context.version === 1 && spec.v1 === 'absent') {
			continue
		}
		if (spec.type === 'nor') {
			const { nor, nrr } = formatNor(value, context)
			if (nor !== undefined) {
				out['nor'] = nor
			}
			if (nrr !== undefined) {
				out['nrr'] = nrr
			}
			continue
		}
		const normalized = normalizeValue(value, spec, context, reportOt)
		if (normalized !== undefined) {
			out[key] = normalized
		}
	}
	return out
}
