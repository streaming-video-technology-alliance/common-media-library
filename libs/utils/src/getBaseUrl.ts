/**
 * Get the base URL from a full URL or a URL object.
 *
 * @param fullUrl - The full URL or URL object.
 * @returns The base URL.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/getBaseUrl.test.ts#example}
 */
export function getBaseUrl(fullUrl: string | URL): string {
	const url = typeof fullUrl === 'string' ? new URL(fullUrl) : fullUrl
	return url.origin + url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1)
}
