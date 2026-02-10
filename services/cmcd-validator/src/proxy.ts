import type { IncomingMessage, ServerResponse } from 'node:http'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { CMCD_PARAM } from '@svta/cml-cmcd'
import { extractCmcd } from './extract.ts'
import { detectManifestType, rewriteManifestUrls } from './manifest.ts'
import type { Store } from './store.ts'
import type { CmcdReport } from './types.ts'

const CMCD_HEADER_KEYS = ['cmcd-object', 'cmcd-request', 'cmcd-session', 'cmcd-status']

/**
 * Extract the upstream target URL from an incoming proxy request.
 *
 * Supports two routing modes:
 * - Query-based: `/proxy?url=<encoded-url>` (primary)
 * - Path-based: `/proxy/<absolute-url>` (fallback for DASH template resolution)
 *
 * @returns The decoded upstream URL, or `null` if not found
 */
export function extractTargetUrl(reqUrl: string, host: string): string | null {
	const parsed = new URL(reqUrl, `http://${host}`)

	// Query-based: /proxy?url=<encoded-url>
	const urlParam = parsed.searchParams.get('url')
	if (urlParam) {
		return urlParam
	}

	// Path-based: /proxy/<absolute-url>
	const pathAfterProxy = parsed.pathname.replace(/^\/proxy\//, '')
	if (pathAfterProxy && pathAfterProxy.startsWith('http')) {
		// Re-append any query string (excluding our own params)
		const qs = parsed.search
		return pathAfterProxy + qs
	}

	return null
}

/**
 * Handle a proxied request: extract CMCD, forward to upstream, rewrite manifests.
 *
 * Accepts requests in two forms:
 * - `/proxy?url=<encoded-url>` — primary, used by players and HLS manifests
 * - `/proxy/<absolute-url>` — fallback, used by DASH BaseURL template resolution
 */
export async function handleProxy(
	req: IncomingMessage,
	res: ServerResponse,
	store: Store,
): Promise<void> {
	const host = req.headers.host || 'localhost'
	const targetUrl = extractTargetUrl(req.url || '/', host)

	if (!targetUrl) {
		res.writeHead(400, { 'Content-Type': 'application/json' })
		res.end(JSON.stringify({ error: 'Missing url parameter. Use /proxy?url=<encoded-url>' }))
		return
	}

	const upstreamUrl = new URL(targetUrl)

	// Extract CMCD data from original request
	const requestUrl = new URL(req.url || '/', `http://${host}`)
	const requestHeaders = new Headers()
	for (const [key, value] of Object.entries(req.headers)) {
		if (typeof value === 'string') {
			requestHeaders.set(key, value)
		} else if (Array.isArray(value)) {
			requestHeaders.set(key, value.join(', '))
		}
	}

	const extracted = extractCmcd(requestUrl, requestHeaders)

	if (extracted) {
		const report: CmcdReport = {
			id: crypto.randomUUID(),
			sessionId: extracted.sessionId || 'unknown',
			type: 'request',
			timestamp: new Date().toISOString(),
			data: extracted.data,
			requestUrl: upstreamUrl.toString(),
			method: req.method,
		}
		store.insert(report)
	}

	// Strip CMCD from the forwarded request
	upstreamUrl.searchParams.delete(CMCD_PARAM)

	// Forward headers, excluding host and CMCD headers
	const forwardHeaders: Record<string, string> = {}
	for (const [key, value] of Object.entries(req.headers)) {
		if (key === 'host' || CMCD_HEADER_KEYS.includes(key.toLowerCase())) {
			continue
		}
		if (typeof value === 'string') {
			forwardHeaders[key] = value
		}
	}

	const upstreamResponse = await fetch(upstreamUrl.toString(), {
		method: req.method,
		headers: forwardHeaders,
		redirect: 'follow',
	})

	// Build response headers with CORS
	const responseHeaders: Record<string, string> = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, OPTIONS',
		'Access-Control-Allow-Headers': '*',
		'Access-Control-Expose-Headers': '*',
	}

	for (const [key, value] of upstreamResponse.headers.entries()) {
		const lower = key.toLowerCase()
		if (lower !== 'transfer-encoding' && lower !== 'content-encoding') {
			responseHeaders[key] = value
		}
	}

	// Check if this is a manifest that needs URL rewriting
	const contentType = upstreamResponse.headers.get('content-type') || ''
	const manifestType = detectManifestType(contentType, upstreamUrl.pathname)

	if (manifestType && upstreamResponse.body) {
		const body = await upstreamResponse.text()
		const rewritten = rewriteManifestUrls(body, upstreamUrl.toString(), manifestType)
		responseHeaders['content-length'] = Buffer.byteLength(rewritten).toString()
		res.writeHead(upstreamResponse.status, responseHeaders)
		res.end(rewritten)
	} else if (upstreamResponse.body) {
		res.writeHead(upstreamResponse.status, responseHeaders)
		const readable = Readable.fromWeb(upstreamResponse.body as never)
		await pipeline(readable, res)
	} else {
		res.writeHead(upstreamResponse.status, responseHeaders)
		res.end()
	}
}
