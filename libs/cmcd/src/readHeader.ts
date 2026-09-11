/** One response header by name, case-insensitively, from a `Headers` object or a record. */
export function readHeader(headers: Headers | Readonly<Record<string, string>> | undefined, name: string): string | undefined {
	if (!headers) {
		return undefined
	}
	if (typeof (headers as Headers).get === 'function') {
		return (headers as Headers).get(name) ?? undefined
	}
	const wanted = name.toLowerCase()
	for (const [key, value] of Object.entries(headers as Record<string, string>)) {
		if (key.toLowerCase() === wanted) {
			return value
		}
	}
	return undefined
}
