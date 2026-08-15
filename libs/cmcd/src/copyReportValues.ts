import type { Cmcd } from './Cmcd.ts'

/**
 * Copies a mutable object held inside an item: an SfToken-shaped value,
 * a byte sequence, or an inner list of either.
 */
function copyBareValue(value: unknown): unknown {
	if (value instanceof Uint8Array) {
		return value.slice()
	}

	if (value instanceof Date) {
		return new Date(value.getTime())
	}

	if (Array.isArray(value)) {
		return value.map(copyBareValue)
	}

	if (value !== null && typeof value === 'object') {
		return Object.assign(Object.create(Object.getPrototypeOf(value)), value)
	}

	return value
}

/**
 * Copies an `SfItem`-shaped value and its `params` record.
 *
 * The prototype is preserved because `prepareCmcdData`, the formatter map,
 * validation, and the structured-field encoder all branch on
 * `instanceof SfItem`. A plain spread (and `structuredClone`) would return a
 * prototype-less object and silently change what goes on the wire.
 */
function copyItemValue(value: unknown): unknown {
	if (value === null || typeof value !== 'object') {
		return value
	}

	if (value instanceof Uint8Array) {
		return value.slice()
	}

	if (value instanceof Date) {
		return new Date(value.getTime())
	}

	const copy = Object.assign(Object.create(Object.getPrototypeOf(value)), value) as { value?: unknown; params?: Record<string, unknown>; }

	if (copy.value !== null && typeof copy.value === 'object') {
		copy.value = copyBareValue(copy.value)
	}

	if (copy.params !== null && typeof copy.params === 'object') {
		const params = copy.params = { ...copy.params }

		for (const key in params) {
			const member = params[key]

			if (member !== null && typeof member === 'object') {
				params[key] = copyBareValue(member)
			}
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
 */
export function copyReportValues(data: Cmcd): Cmcd {
	const record = data as Record<string, unknown>

	for (const key in record) {
		const value = record[key]

		if (Array.isArray(value)) {
			const copy = new Array(value.length)

			for (let i = 0; i < value.length; i++) {
				copy[i] = copyItemValue(value[i])
			}

			record[key] = copy
		}
		else if (value !== null && typeof value === 'object') {
			record[key] = copyItemValue(value)
		}
	}

	return data
}
