import type { IncomingMessage, ServerResponse } from 'node:http'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { CMCD_PARAM } from '@svta/cml-cmcd'
import { extractCmcd } from './extract.ts'
import { detectManifestType, rewriteManifestUrls } from './manifest.ts'
import type { Store } from './store.ts'
import type { CmcdReport } from './types.ts'

const PROXY_PREFIX = '/proxy'

const CMCD_HEADER_KEYS = ['cmcd-object', 'cmcd-request', 'cmcd-session', 'cmcd-status']

/**
 * Handle a proxied request: extract CMCD, forward to upstream, rewrite manifests.
 */
export async function handleProxy(
	req: IncomingMessage,
	res: ServerResponse,
	upstream: string,
	store: Store,
): Promise<void> {
	const path = req.url!.slice(PROXY_PREFIX.length)
	const upstreamBase = upstream.replace(/\/$/, '')

	// Build upstream URL preserving query params (minus CMCD)
	const upstreamUrl = new URL(path, upstreamBase + '/')

	// Extract CMCD data from original request
	const requestUrl = new URL(req.url!, `http://${req.headers.host || 'localhost'}`)
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
		const rewritten = rewriteManifestUrls(body, upstream, PROXY_PREFIX)
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
