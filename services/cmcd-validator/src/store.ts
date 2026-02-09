import Database from 'better-sqlite3'
import type { CmcdReport } from './types.ts'

interface ReportRow {
	id: string;
	session_id: string;
	type: string;
	timestamp: string;
	data: string;
	request_url: string | null;
	method: string | null;
	event_type: string | null;
}

function toReport(row: ReportRow): CmcdReport {
	return {
		id: row.id,
		sessionId: row.session_id,
		type: row.type as 'request' | 'event',
		timestamp: row.timestamp,
		data: JSON.parse(row.data),
		requestUrl: row.request_url ?? undefined,
		method: row.method ?? undefined,
		eventType: row.event_type ?? undefined,
	}
}

/**
 * SQLite store for CMCD reports.
 */
export class Store {
	private db: Database.Database

	constructor(dbPath: string) {
		this.db = new Database(dbPath)
		this.db.pragma('journal_mode = WAL')
		this.db.exec(`
			CREATE TABLE IF NOT EXISTS reports (
				id TEXT PRIMARY KEY,
				session_id TEXT NOT NULL,
				type TEXT NOT NULL,
				timestamp TEXT NOT NULL,
				data TEXT NOT NULL,
				request_url TEXT,
				method TEXT,
				event_type TEXT
			)
		`)
		this.db.exec(`
			CREATE INDEX IF NOT EXISTS idx_session_id ON reports (session_id)
		`)
		this.db.exec(`
			CREATE INDEX IF NOT EXISTS idx_type ON reports (type)
		`)
	}

	insert(report: CmcdReport): void {
		this.db.prepare(`
			INSERT INTO reports (id, session_id, type, timestamp, data, request_url, method, event_type)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`).run(
			report.id,
			report.sessionId,
			report.type,
			report.timestamp,
			JSON.stringify(report.data),
			report.requestUrl ?? null,
			report.method ?? null,
			report.eventType ?? null,
		)
	}

	getBySessionId(sessionId: string): CmcdReport[] {
		const rows = this.db
			.prepare('SELECT * FROM reports WHERE session_id = ? ORDER BY timestamp')
			.all(sessionId) as ReportRow[]
		return rows.map(toReport)
	}

	getAll(type?: string): CmcdReport[] {
		if (type) {
			const rows = this.db
				.prepare('SELECT * FROM reports WHERE type = ? ORDER BY timestamp')
				.all(type) as ReportRow[]
			return rows.map(toReport)
		}

		const rows = this.db
			.prepare('SELECT * FROM reports ORDER BY timestamp')
			.all() as ReportRow[]
		return rows.map(toReport)
	}

	getSessionIds(): string[] {
		const rows = this.db
			.prepare('SELECT DISTINCT session_id FROM reports ORDER BY session_id')
			.all() as Array<{ session_id: string }>
		return rows.map(r => r.session_id)
	}

	clear(): void {
		this.db.exec('DELETE FROM reports')
	}

	close(): void {
		this.db.close()
	}
}
