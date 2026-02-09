import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Cmcd } from '@svta/cml-cmcd'
import { decodeCmcd } from '@svta/cml-cmcd'
import type { Store } from './store.ts'
import type { CmcdReport } from './types.ts'

function readBody(req: IncomingMessage): Promise<string> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = []
		req.on('data', (chunk: Buffer) => chunks.push(chunk))
		req.on('end', () => resolve(Buffer.concat(chunks).toString()))
		req.on('error', reject)
	})
}

/**
 * Handle a CMCD v2 event report POST.
 *
 * Supports:
 * - `text/cmcd`: newline-separated CMCD-encoded strings (native CmcdReporter format)
 * - `application/json`: JSON array of objects or single object
 * - Fallback: treat as newline-separated CMCD-encoded strings
 */
export async function handleEvent(
	req: IncomingMessage,
	res: ServerResponse,
	store: Store,
	targetId: string,
): Promise<void> {
	const body = await readBody(req)
	const contentType = (req.headers['content-type'] || '').toLowerCase()

	let events: Cmcd[] = []

	if (contentType.includes('text/cmcd') || contentType.includes('text/plain')) {
		const lines = body.split('\n').filter(Boolean)
		events = lines.map(line => decodeCmcd(line))
	} else if (contentType.includes('application/json')) {
		const parsed: unknown = JSON.parse(body)
		if (Array.isArray(parsed)) {
			events = parsed.map(item =>
				typeof item === 'string' ? decodeCmcd(item) : item as Cmcd,
			)
		} else if (typeof parsed === 'object' && parsed !== null) {
			events = [parsed as Cmcd]
		}
	} else {
		// Fallback: try CMCD-encoded lines
		const lines = body.split('\n').filter(Boolean)
		events = lines.map(line => decodeCmcd(line))
	}

	for (const event of events) {
		const report: CmcdReport = {
			id: crypto.randomUUID(),
			sessionId: typeof event.sid === 'string' ? event.sid : 'unknown',
			type: 'event',
			timestamp: new Date().toISOString(),
			data: event,
			targetId,
			eventType: typeof event.e === 'string' ? event.e : undefined,
		}
		store.insert(report)
	}

	res.writeHead(204, {
		'Access-Control-Allow-Origin': '*',
	})
	res.end()
}
