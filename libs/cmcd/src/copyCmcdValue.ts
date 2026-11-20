import { SfItem } from '@svta/cml-structured-field-values'

function copyItem(value: unknown): unknown {
	if (value instanceof SfItem) {
		const inner: unknown = value.value

		return new SfItem(
			Array.isArray(inner) ? inner.map(copyItem) : inner,
			value.params && { ...value.params },
		)
	}

	return value
}

/**
 * Copies a CMCD value. The copy shares no list, `SfItem`, or parameter object with the input.
 *
 * @param value - A bare value, an `SfItem`, or a list of them.
 * @returns The copy.
 *
 * @internal
 */
export function copyCmcdValue(value: unknown): unknown {
	return Array.isArray(value) ? value.map(copyItem) : copyItem(value)
}
