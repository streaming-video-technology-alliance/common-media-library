import type { Cmcd } from './Cmcd.ts'

/**
 * Copies one nested report value: byte sequences and dates by content,
 * arrays element by element, and objects as prototype-preserving shell
 * copies whose own object-typed members are copied the same way.
 *
 * The prototype is preserved because `prepareCmcdData`, the formatter map,
 * validation, and the structured-field encoder all branch on
 * `instanceof SfItem` and `instanceof SfToken`. A plain spread (and
 * `structuredClone`) would return a prototype-less object and silently
 * change what goes on the wire. `Uint8Array` and `Date` are copied by
 * content because a shell copy of either loses the internal slot their
 * serialization reads.
 */
function copyValue(value: unknown): unknown {
	if (value === null || typeof value !== 'object') {
		return value
	}

	if (value instanceof Uint8Array) {
		return new Uint8Array(value)
	}

	if (value instanceof Date) {
		return new Date(value.getTime())
	}

	if (Array.isArray(value)) {
		return value.map(copyValue)
	}

	const copy = Object.assign(Object.create(Object.getPrototypeOf(value)), value) as Record<string, unknown>

	for (const key in copy) {
		const member = copy[key]

		if (member !== null && typeof member === 'object') {
			copy[key] = copyValue(member)
		}
	}

	return copy
}

/**
 * Copies the nested values of a report in place so a transform cannot mutate
 * the reporter's persistent data, or another target's report for the same
 * event, by mutating an array or an `SfItem` it was handed.
 *
 * Complete for the CMCD value space rather than best-effort: `CmcdValue` and
 * `CmcdCustomValue` admit only primitives, `SfItem<primitive>`, and arrays of
 * those, and `SfItem.params` is a flat record. Called where a transform is
 * configured, on the ended session's store at archival (detaching the frozen
 * snapshot from caller-held references), and on the request's stored
 * player-facing view.
 *
 * @internal
 */
export function copyReportValues(data: Cmcd): Cmcd {
	const record = data as Record<string, unknown>

	for (const key in record) {
		const value = record[key]

		if (value !== null && typeof value === 'object') {
			record[key] = copyValue(value)
		}
	}

	return data
}
