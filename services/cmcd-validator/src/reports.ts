import type { ServerResponse } from 'node:http'
import type { Store } from './store.ts'
import type { CmcdReport } from './types.ts'

/**
 * Respond with reports, optionally filtered by session ID and/or type.
 */
export function handleReports(
	res: ServerResponse,
	store: Store,
	sessionId?: string,
	typeFilter?: string,
): void {
	let reports: CmcdReport[]

	if (sessionId) {
		reports = store.getBySessionId(sessionId)
		if (typeFilter) {
			reports = reports.filter(r => r.type === typeFilter)
		}
	} else {
		reports = store.getAll(typeFilter || undefined)
	}

	const keysObserved = new Set<string>()
	for (const report of reports) {
		for (const key of Object.keys(report.data)) {
			keysObserved.add(key)
		}
	}

	const response = {
		sessionId: sessionId || undefined,
		count: reports.length,
		reports,
		summary: {
			totalRequests: reports.filter(r => r.type === 'request').length,
			totalEvents: reports.filter(r => r.type === 'event').length,
			keysObserved: [...keysObserved].sort(),
		},
	}

	res.writeHead(200, {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': '*',
	})
	res.end(JSON.stringify(response, null, 2))
}

/**
 * Clear all reports.
 */
export function handleDeleteReports(
	res: ServerResponse,
	store: Store,
): void {
	store.clear()
	res.writeHead(204, {
		'Access-Control-Allow-Origin': '*',
	})
	res.end()
}
