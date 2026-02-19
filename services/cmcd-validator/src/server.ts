import { createServer } from 'node:http'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleEvent } from './events.ts'
import { handleDeleteReports, handleReports, handleSessions } from './reports.ts'
import { Store } from './store.ts'
import type { ServerConfig } from './types.ts'

function setCorsHeaders(res: ServerResponse): void {
	res.setHeader('Access-Control-Allow-Origin', '*')
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
	res.setHeader('Access-Control-Allow-Headers', '*')
	res.setHeader('Access-Control-Expose-Headers', '*')
}

/**
 * Start the CMCD validator server.
 */
export function startServer(config: ServerConfig): void {
	const store = new Store(config.dbPath)

	const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
		setCorsHeaders(res)

		if (req.method === 'OPTIONS') {
			res.writeHead(204)
			res.end()
			return
		}

		const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
		const pathname = url.pathname

		try {
			const eventMatch = pathname.match(/^\/cmcd\/event\/([^/]+)\/?$/)
			if (eventMatch && req.method === 'POST') {
				const targetId = decodeURIComponent(eventMatch[1])
				await handleEvent(req, res, store, targetId)
				return
			}

			if (pathname === '/sessions' && req.method === 'GET') {
				handleSessions(res, store)
				return
			}

			const reportsMatch = pathname.match(/^\/reports\/(.+)$/)
			if (reportsMatch && req.method === 'GET') {
				const sessionId = decodeURIComponent(reportsMatch[1])
				const typeFilter = url.searchParams.get('type') || undefined
				const eventTypeFilter = url.searchParams.get('eventType') || undefined
				const targetIdFilter = url.searchParams.get('targetId') || undefined
				handleReports(res, store, sessionId, typeFilter, eventTypeFilter, targetIdFilter)
				return
			}

			if (pathname === '/reports' && req.method === 'GET') {
				const typeFilter = url.searchParams.get('type') || undefined
				const eventTypeFilter = url.searchParams.get('eventType') || undefined
				const targetIdFilter = url.searchParams.get('targetId') || undefined
				handleReports(res, store, undefined, typeFilter, eventTypeFilter, targetIdFilter)
				return
			}

			if (pathname === '/reports' && req.method === 'DELETE') {
				handleDeleteReports(res, store)
				return
			}

			if (pathname === '/health') {
				res.writeHead(200, { 'Content-Type': 'application/json' })
				res.end(JSON.stringify({ status: 'ok' }))
				return
			}

			res.writeHead(404, { 'Content-Type': 'application/json' })
			res.end(JSON.stringify({ error: 'Not Found' }))
		} catch (err) {
			console.error('Request error:', err)
			if (!res.headersSent) {
				res.writeHead(502, { 'Content-Type': 'application/json' })
				res.end(JSON.stringify({ error: 'Bad Gateway', message: (err as Error).message }))
			}
		}
	})

	server.listen(config.port, () => {
		console.log(`CMCD Validator running on http://localhost:${config.port}`)
		console.log(`  Events:   POST http://localhost:${config.port}/cmcd/event/:id`)
		console.log(`  Reports:  http://localhost:${config.port}/reports`)
		console.log(`  Database: ${config.dbPath}`)
	})
}
