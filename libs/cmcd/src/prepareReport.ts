import type { CmcdKeySpec } from './CmcdKeySpec.ts'
import { CMCD_EVENT_MODE } from './CmcdReportingMode.ts'
import { formatNor } from './formatNor.ts'
import { getKeySpec } from './getKeySpec.ts'
import { normalizeValue, toTokenText } from './normalizeValue.ts'
import type { PrepareContext } from './PrepareContext.ts'

/** Whether the spec rules make `key` required on the report's event. */
export function isRequired(spec: CmcdKeySpec, event: string | undefined): boolean {
	return spec.requiredOn === 'always' || (spec.requiredOn !== undefined && spec.requiredOn === event)
}

function isPresent(value: unknown): boolean {
	return Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null
}

/** Whether a report carries `key` in this mode and version. Keys of the other mode and the version 1 drops are removed. */
function carries(spec: CmcdKeySpec, value: unknown, context: PrepareContext): boolean {
	return value !== undefined && value !== null && (spec.modes !== 'event' || context.mode === CMCD_EVENT_MODE) && (context.version !== 1 || spec.v1 !== 'absent')
}

/** The normalized value of one key of the report, for the aggregate key rule. */
function normalizedValue(report: Record<string, unknown>, key: string, context: PrepareContext, ot: string | undefined): unknown {
	const spec = getKeySpec(key)
	const value = report[key]
	return spec !== undefined && carries(spec, value, context) ? normalizeValue(value, spec, context, ot) : undefined
}

/**
 * Plain report values to structured-field values, in sorted key order, in one pass over the keys with one spec
 * lookup per key. Without `filter`, the result is the view a transform receives: every key the mode and version
 * carry. With `filter`, the spec rules and the key allowlist apply too. A key sent only on one event is removed
 * from the other events. `d` and `tpb` follow the object type rule. An aggregate key yields to its exact key.
 * A key outside the allowlist is removed unless the event requires it. A value equal to its default is removed.
 */
export function prepareReport(report: Record<string, unknown>, context: PrepareContext, filter: boolean): Record<string, unknown> {
	const out: Record<string, unknown> = {}
	const keys = context.keys
	const ot = toTokenText(report['ot'])
	// The object type rule reads `ot` as normalized, so an unknown token removes neither `d` nor `tpb`.
	const ruleOt = ot !== undefined && getKeySpec('ot')?.tokens?.includes(ot) === true ? ot : undefined
	// Version 1 derives `nrr` from `nor`. It waits for its sorted position, so the output stays in key order.
	let derivedNrr: string | undefined
	for (const key of Object.keys(report).sort()) {
		if (derivedNrr !== undefined && key > 'nrr') {
			out['nrr'] = derivedNrr
			derivedNrr = undefined
		}
		const spec = getKeySpec(key)
		const value = report[key]
		if (spec === undefined || !carries(spec, value, context)) {
			continue
		}
		let required = false
		if (filter) {
			if (spec.onlyOn !== undefined && spec.onlyOn !== context.event) {
				continue
			}
			if (spec.ot !== undefined && context.version === 2 && ruleOt !== undefined && !spec.ot.includes(ruleOt)) {
				continue
			}
			if (spec.supersededBy !== undefined && isPresent(normalizedValue(report, spec.supersededBy, context, ot))) {
				continue
			}
			required = isRequired(spec, context.event)
			if (keys !== undefined && !required && spec.type !== 'nor' && !keys.has(key)) {
				continue
			}
		}
		if (spec.type === 'nor') {
			const { nor, nrr } = formatNor(value, context)
			if (nor !== undefined && (!filter || keys === undefined || keys.has('nor'))) {
				out['nor'] = nor
			}
			if (nrr !== undefined && (!filter || keys === undefined || keys.has('nrr'))) {
				derivedNrr = nrr
			}
			continue
		}
		const normalized = normalizeValue(value, spec, context, ot)
		if (normalized === undefined) {
			continue
		}
		if (filter && !required && spec.omitDefault !== undefined && normalized === spec.omitDefault) {
			continue
		}
		out[key] = normalized
		if (key === 'nrr') {
			derivedNrr = undefined
		}
	}
	if (derivedNrr !== undefined) {
		out['nrr'] = derivedNrr
	}
	return out
}
