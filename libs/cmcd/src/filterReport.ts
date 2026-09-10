import { getKeySpec } from './getKeySpec.ts'
import type { CmcdKeySpec } from './CmcdKeySpec.ts'
import { toTokenText } from './normalizeValue.ts'
import type { PrepareContext } from './PrepareContext.ts'

/** Whether the spec rules make `key` required on the report's event. */
export function isRequired(spec: CmcdKeySpec, event: string | undefined): boolean {
	return spec.requiredOn === 'always' || (spec.requiredOn !== undefined && spec.requiredOn === event)
}

function isPresent(value: unknown): boolean {
	return Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null
}

/** Applies the key allowlist and the spec rules to a normalized report. The result is in sorted key order. */
export function filterReport(normalized: Record<string, unknown>, context: PrepareContext): Record<string, unknown> {
	const out: Record<string, unknown> = {}
	const reportOt = toTokenText(normalized['ot'])
	for (const key of Object.keys(normalized).sort()) {
		const spec = getKeySpec(key)
		const value = normalized[key]
		if (!spec) {
			continue
		}
		if (context.version === 1 && spec.v1 === 'absent') {
			continue
		}
		if (spec.onlyOn !== undefined && spec.onlyOn !== context.event) {
			continue
		}
		if (spec.ot !== undefined && context.version === 2 && reportOt !== undefined && !spec.ot.includes(reportOt)) {
			continue
		}
		if (spec.supersededBy !== undefined && isPresent(normalized[spec.supersededBy])) {
			continue
		}
		const required = isRequired(spec, context.event)
		if (context.keys !== undefined && !context.keys.has(key) && !required) {
			continue
		}
		if (spec.omitDefault !== undefined && value === spec.omitDefault && !required) {
			continue
		}
		out[key] = value
	}
	return out
}
