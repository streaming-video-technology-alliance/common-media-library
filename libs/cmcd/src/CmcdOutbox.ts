import type { HttpRequest } from '@svta/cml-utils'
import { CMCD_MIME_TYPE } from './CMCD_MIME_TYPE.ts'

export type CmcdRequester = (request: HttpRequest) => Promise<{ status: number; }>

export class CmcdOutbox {
	private queue: string[] = []
	private url: string
	private batchSize: number
	private requester: CmcdRequester
	private onGone: () => void
	private onDirty: () => void

	disposed = false

	constructor(url: string, batchSize: number, requester: CmcdRequester, onGone: () => void, onDirty: () => void) {
		this.url = url
		this.batchSize = batchSize
		this.requester = requester
		this.onGone = onGone
		this.onDirty = onDirty
	}

	push(line: string): void {
		this.queue.push(line)
	}

	dispose(): void {
		this.disposed = true
		this.queue.length = 0
	}

	process(drain: boolean): boolean {
		if (this.disposed || !this.queue.length) {
			return false
		}

		if (this.queue.length < this.batchSize && !drain) {
			this.onDirty()
			return false
		}

		const deleteCount = drain ? this.queue.length : this.batchSize
		const events = this.queue.splice(0, deleteCount)

		this.send(events).catch(() => {
			this.queue.unshift(...events)
			this.onDirty()
		})

		return this.queue.length > 0
	}

	private async send(data: string[]): Promise<void> {
		const response = await this.requester({
			url: this.url,
			method: 'POST',
			headers: {
				'Content-Type': CMCD_MIME_TYPE,
			},
			body: data.join('\n') + '\n',
		})

		const { status } = response

		if (status === 410) {
			this.onGone()
		} else if (status === 429 || (status > 499 && status < 600)) {
			throw new Error(`Event report failed with status ${status}`)
		}
	}
}
