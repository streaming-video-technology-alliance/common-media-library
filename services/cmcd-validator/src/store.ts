import { existsSync, readFileSync, appendFileSync, writeFileSync } from 'node:fs'
import type { CmcdReport } from './types.ts'

/**
 * Flat-file JSONL store for CMCD reports.
 */
export class Store {
	private filePath: string

	constructor(filePath: string) {
		this.filePath = filePath

		if (!existsSync(this.filePath)) {
			writeFileSync(this.filePath, '')
		}
	}

	insert(report: CmcdReport): void {
		appendFileSync(this.filePath, JSON.stringify(report) + '\n')
	}

	getBySessionId(sessionId: string): CmcdReport[] {
		return this.getAll().filter(r => r.sessionId === sessionId)
	}

	getAll(type?: string): CmcdReport[] {
		if (!existsSync(this.filePath)) {
			return []
		}

		const content = readFileSync(this.filePath, 'utf-8')
		const reports = content
			.split('\n')
			.filter(Boolean)
			.map(line => JSON.parse(line) as CmcdReport)

		if (type) {
			return reports.filter(r => r.type === type)
		}

		return reports
	}

	getSessionIds(): string[] {
		const reports = this.getAll()
		const ids = new Set<string>()
		for (const report of reports) {
			ids.add(report.sessionId)
		}
		return [...ids].sort()
	}

	clear(): void {
		writeFileSync(this.filePath, '')
	}
}
