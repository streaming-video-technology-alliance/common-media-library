/**
 * Sets query parameters in the search string of a URL.
 *
 * The names are processed in code point order, which is the UTF-8 order.
 * A parameter replaces the first parameter of the same name and removes the
 * later ones, or it is appended. Names and values are not encoded.
 *
 * @param search - The search string, with or without the leading `?`.
 * @param params - The query parameters to set.
 * @returns The new search string, without the leading `?`.
 *
 * @internal
 */
export function replaceQueryParams(search: string, params: Readonly<Record<string, string>>): string {
	const query = search.startsWith('?') ? search.slice(1) : search
	const parts = query ? query.split('&') : []

	for (const name of Object.keys(params).sort(compareCodePoints)) {
		const value = params[name]

		if (!name || typeof value !== 'string') {
			continue
		}

		const param = `${name}=${value}`
		const index = parts.findIndex(part => isParam(part, name))

		if (index === -1) {
			parts.push(param)
			continue
		}

		parts[index] = param

		for (let i = parts.length - 1; i > index; i--) {
			if (isParam(parts[i], name)) {
				parts.splice(i, 1)
			}
		}
	}

	return parts.join('&')
}

function isParam(part: string, name: string): boolean {
	return part === name || part.startsWith(`${name}=`)
}

function compareCodePoints(a: string, b: string): number {
	const length = Math.min(a.length, b.length)

	for (let i = 0; i < length; i++) {
		const x = a.codePointAt(i) ?? 0
		const y = b.codePointAt(i) ?? 0

		if (x !== y) {
			return x - y
		}

		if (x > 0xffff) {
			i++
		}
	}

	return a.length - b.length
}
