import type { Cmcd } from './Cmcd.ts'
import type { CmcdKey } from './CmcdKey.ts'
import type { CmcdTransformRequest } from './CmcdTransformRequest.ts'
import { copyReportValues } from './copyReportValues.ts'

/**
 * Whether a required key's value will survive report preparation.
 *
 * This is `isValid` minus its `false` exclusion, plus an empty-array check.
 * `false` must count as usable because `bg: false` is a legitimate value on a
 * backgrounded-mode event, which the encoder emits as `?0`; treating it as
 * unusable would let restoration silently revert a transform that cleared it.
 * Empty strings, empty lists and non-finite numbers are dropped downstream, so
 * a transform substituting one leaves the report short a required key.
 */
function isUsableRequiredValue(value: unknown): boolean {
	if (value == null || value === '') {
		return false
	}

	if (typeof value === 'number') {
		return Number.isFinite(value)
	}

	return !Array.isArray(value) || value.length > 0
}

export function applyReportPolicy<C, R extends CmcdTransformRequest<C> | undefined>(
	report: Cmcd,
	transform: ((data: Cmcd, request: R) => Cmcd | null) | undefined,
	request: R,
	requiredKey: CmcdKey | undefined,
	restoreTs: boolean,
): Cmcd | null {
	if (!transform) {
		return report
	}

	// The spread above is shallow, so nested values are still shared with
	// the persistent store and with sibling targets' inputs; a transform
	// gets its own detached copy so in-place mutation reaches neither.
	copyReportValues(report)

	const ts = report.ts
	// Captured so a transform cannot strip a key the event requires.
	// `CmcdKey` spans custom keys too, so index through a record view.
	const requiredValue = requiredKey ? (report as Record<string, unknown>)[requiredKey] : undefined

	const out = transform(report, request)

	// A cancelled report consumes neither a sequence number nor msd.
	if (out == null) {
		return null
	}

	// Restore, never fabricate: a required key that was already absent (or
	// already unusable) before the transform ran was a caller bug, not a
	// transform bug. Removal and substitution are both covered, because a
	// value the encoder drops leaves the report just as invalid as a missing
	// one.
	if (restoreTs && !isUsableRequiredValue(out.ts)) {
		out.ts = ts
	}

	if (requiredKey && isUsableRequiredValue(requiredValue) && !isUsableRequiredValue((out as Record<string, unknown>)[requiredKey])) {
		Object.assign(out, { [requiredKey]: requiredValue })
	}

	return out
}
