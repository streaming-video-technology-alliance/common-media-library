import { SfItem, SfToken, symbolToStr } from '@svta/cml-structured-field-values'

/**
 * Resolve the text of a token value.
 *
 * A token may be a plain string, a registry `Symbol`, an `SfToken`, or an
 * `SfItem` that wraps one of those.
 *
 * @param value - The value to resolve.
 *
 * @returns The token text, or `undefined` when the value is not a token.
 *
 * @internal
 */
export function toTokenString(value: unknown): string | undefined {
	if (value instanceof SfItem) {
		return toTokenString(value.value)
	}

	if (typeof value === 'string') {
		return value
	}

	if (typeof value === 'symbol' || value instanceof SfToken) {
		return symbolToStr(value)
	}

	return undefined
}
