/**
 * Detect if a response is a manifest based on content type and URL.
 */
export function detectManifestType(contentType: string, url: string): 'hls' | 'dash' | null {
	const ct = contentType.toLowerCase()

	if (ct.includes('mpegurl') || ct.includes('x-mpegurl') || url.endsWith('.m3u8') || url.endsWith('.m3u')) {
		return 'hls'
	}

	if (ct.includes('dash+xml') || url.endsWith('.mpd')) {
		return 'dash'
	}

	return null
}

/**
 * Resolve a URL reference against a base URL and return the proxy URL.
 *
 * @param ref - The URL reference found in the manifest (relative or absolute)
 * @param baseUrl - The URL the manifest was fetched from
 * @returns The proxy URL: `/proxy?url=<encoded-absolute-url>`
 */
function toProxyUrl(ref: string, baseUrl: string): string {
	const absolute = new URL(ref, baseUrl).href
	return `/proxy?url=${encodeURIComponent(absolute)}`
}

/**
 * Resolve a URL reference against a base URL and return a path-based proxy URL.
 * Used for DASH BaseURL so that relative template resolution still works.
 *
 * @param ref - The URL reference found in the manifest (relative or absolute)
 * @param baseUrl - The URL the manifest was fetched from
 * @returns The proxy URL: `/proxy/<absolute-url>`
 */
function toProxyPath(ref: string, baseUrl: string): string {
	const absolute = new URL(ref, baseUrl).href
	return `/proxy/${absolute}`
}

/**
 * Rewrite URLs in an HLS manifest to route through the proxy.
 *
 * Resolves all URLs (relative and absolute) against the manifest's own URL,
 * then rewrites each as `/proxy?url=<encoded-absolute-url>`.
 *
 * @param content - The manifest text
 * @param manifestUrl - The URL the manifest was fetched from
 * @returns The rewritten manifest
 */
export function rewriteHlsUrls(content: string, manifestUrl: string): string {
	const lines = content.split('\n')
	const result: string[] = []

	for (const line of lines) {
		if (line === '' || line.startsWith('#')) {
			// Rewrite URI="..." attributes within tags
			result.push(rewriteUriAttributes(line, manifestUrl))
		} else {
			// This is a URI line — resolve and rewrite
			result.push(toProxyUrl(line.trim(), manifestUrl))
		}
	}

	return result.join('\n')
}

/**
 * Rewrite `URI="..."` attributes in an HLS tag line.
 */
function rewriteUriAttributes(line: string, manifestUrl: string): string {
	return line.replace(/URI="([^"]+)"/g, (_match, uri: string) => {
		return `URI="${toProxyUrl(uri, manifestUrl)}"`
	})
}

/**
 * Rewrite URLs in a DASH manifest to route through the proxy.
 *
 * - `<BaseURL>` elements are rewritten using path-based proxy URLs so that
 *   relative template resolution (e.g., `$Number$.m4s`) still works.
 * - Absolute `http(s)://` URLs in attributes are rewritten using query-based
 *   proxy URLs.
 *
 * @param content - The manifest XML text
 * @param manifestUrl - The URL the manifest was fetched from
 * @returns The rewritten manifest
 */
export function rewriteDashUrls(content: string, manifestUrl: string): string {
	let result = content

	// Rewrite <BaseURL> element content using path-based URLs for template compat
	result = result.replace(/<BaseURL>(.*?)<\/BaseURL>/g, (_match, url: string) => {
		const trimmed = url.trim()
		if (trimmed === '') return _match
		return `<BaseURL>${toProxyPath(trimmed, manifestUrl)}</BaseURL>`
	})

	// Rewrite absolute http(s) URLs in attributes (but not inside <BaseURL> which was already handled)
	result = result.replace(/="(https?:\/\/[^"]+)"/g, (_match, url: string) => {
		return `="${toProxyUrl(url, manifestUrl)}"`
	})

	return result
}

/**
 * Rewrite manifest URLs to route through the proxy.
 *
 * @param content - The manifest text
 * @param manifestUrl - The URL the manifest was fetched from
 * @param type - The manifest type ('hls' or 'dash')
 * @returns The rewritten manifest
 */
export function rewriteManifestUrls(content: string, manifestUrl: string, type: 'hls' | 'dash'): string {
	if (type === 'hls') {
		return rewriteHlsUrls(content, manifestUrl)
	}
	return rewriteDashUrls(content, manifestUrl)
}
