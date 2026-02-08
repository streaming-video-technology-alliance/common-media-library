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

function escapeRegExp(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Rewrite absolute URLs in a manifest to route through the proxy.
 *
 * Replaces all occurrences of the upstream base URL with the proxy prefix,
 * including protocol-relative URLs.
 */
export function rewriteManifestUrls(content: string, upstream: string, proxyBase: string): string {
	const upstreamUrl = new URL(upstream)
	const origin = upstreamUrl.origin
	const basePath = upstreamUrl.pathname.replace(/\/$/, '')
	const fullUpstream = origin + basePath

	let result = content.replaceAll(fullUpstream, proxyBase)

	// Also handle protocol-relative URLs
	const protocolRelative = '//' + upstreamUrl.host + basePath
	result = result.replaceAll(protocolRelative, proxyBase)

	// Handle any URL-encoded variants
	const encodedUpstream = encodeURI(fullUpstream)
	if (encodedUpstream !== fullUpstream) {
		result = result.replace(new RegExp(escapeRegExp(encodedUpstream), 'g'), proxyBase)
	}

	return result
}
