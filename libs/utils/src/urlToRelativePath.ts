/**
 * Constructs a relative path from a URL.
 *
 * If `url` is already a relative path, or its origin differs from `base`, it is returned unchanged.
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
	const relativePath = '../'.repeat(fromPath.length - common) + toPath.slice(common).join('/')

	// preserve query parameters and hash of the destination url
	return relativePath + to.search + to.hash
}
