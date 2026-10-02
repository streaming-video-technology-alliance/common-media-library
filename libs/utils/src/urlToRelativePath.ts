// RFC 3986 section 3.1 scheme and ":".
// The WHATWG URL parser first removes leading C0 control or space and every ASCII tab or newline.
const SCHEME_REGEX = /^[\0-\x20]*[a-z][a-z0-9+.\t\n\r-]*:/i

/**
 * Constructs a relative path from a URL.
 *
 * If `url` is already relative, or its origin differs from `base`, the function returns `url` unchanged.
 *
 * @param url - The destination URL
 * @param base - The base URL
 * @returns The relative path
 *
 * @public
 *
 * @example
 * {@includeCode ../test/urlToRelativePath.test.ts#example}
 */
export function urlToRelativePath(url: string, base: string): string {
	if (!SCHEME_REGEX.test(url)) {
		return url
	}

	let to: URL
	try {
		to = new URL(url)
	}
	catch {
		return url
	}

	const from = new URL(base)

	if (to.origin !== from.origin) {
		return url
	}

	const toPath = to.pathname.split('/').slice(1)
	const fromPath = from.pathname.split('/').slice(1, -1)

	// count common parents, stopping before the destination file
	let common = 0

	while (common < toPath.length - 1 && common < fromPath.length && toPath[common] === fromPath[common]) {
		common++
	}

	// add back paths
	const ups = fromPath.length - common
	let relativePath = '../'.repeat(ups) + toPath.slice(common).join('/')

	// RFC 3986 section 4.2: a relative-path reference cannot be empty, start with "/", or have ":" in its first segment
	if (ups === 0 && (relativePath === '' || relativePath.startsWith('/') || toPath[common].includes(':'))) {
		relativePath = './' + relativePath
	}

	// preserve query parameters and hash of the destination url
	return relativePath + to.search + to.hash
}
