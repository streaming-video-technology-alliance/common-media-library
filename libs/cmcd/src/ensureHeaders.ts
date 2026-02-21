/**
 * Converts a record of header fields to a `Headers` instance if necessary.
 *
 * @param headers - A `Headers` instance or a plain record of header fields.
 * @returns A `Headers` instance.
 *
 * @internal
 */
export function ensureHeaders(headers: Record<string, string> | Headers): Headers {
	return headers instanceof Headers ? headers : new Headers(headers)
}
