// The sub-delims of RFC 3986 that `encodeURIComponent` does not encode.
const SUB_DELIMS_REGEX = /[!'()*]/g
const SURROGATE_REGEX = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDFFF]/g

function encodeSubDelim(char: string): string {
	return `%${char.charCodeAt(0).toString(16).toUpperCase()}`
}

function replaceUnpaired(match: string): string {
	return match.length === 2 ? match : '�'
}

/**
 * Percent-encode a string for the `CMCD` query parameter.
 *
 * Only the unreserved characters of RFC 3986 stay unencoded: letters, digits,
 * `-`, `.`, `_`, and `~`. The query examples of CTA-5004-B use this encoding.
 * An unpaired surrogate becomes U+FFFD.
 *
 * @param value - The string to encode.
 * @returns The encoded string.
 *
 * @internal
 */
export function percentEncode(value: string): string {
	let encoded: string

	try {
		encoded = encodeURIComponent(value)
	}
	catch {
		encoded = encodeURIComponent(value.replace(SURROGATE_REGEX, replaceUnpaired))
	}

	return encoded.replace(SUB_DELIMS_REGEX, encodeSubDelim)
}
