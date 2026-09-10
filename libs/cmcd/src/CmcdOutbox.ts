import type { HttpRequest } from '@svta/cml-utils'
import { CMCD_MIME_TYPE } from './CMCD_MIME_TYPE.ts'

/**
 * Sends one report request and resolves with the response status.
 *
 * @internal
 */
export type CmcdRequester = (request: HttpRequest) => Promise<{ status: number; }>

/**
 * One event target's send pipeline: a FIFO queue of already-encoded report
 * lines, batched and POSTed to `url`, with a failed send re-queued for a
 * later pass. `onGone` and `onDirty` report status back to whatever
 * constructed this instance.
 *
 * @internal
 */
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
		this.onDirty()
	}

	dispose(): void {
		this.disposed = true
		this.queue.length = 0
	}

	process(drain: boolean): boolean {
		if (this.disposed || !this.queue.length) {
			return false
		}

		let dispatched = false

		if (this.queue.length >= this.batchSize || drain) {
			const deleteCount = drain ? this.queue.length : this.batchSize
			const events = this.queue.splice(0, deleteCount)

			this.send(events).catch(() => {
				this.queue.unshift(...events)
				this.onDirty()
			})

			dispatched = true
		}

		// Unsent lines remain, so report that through onDirty. Callers never
		// read the queue state themselves. The failed-send callback above
		// calls onDirty separately, because its re-queue runs after this
		// method has returned.
		if (this.queue.length > 0) {
			this.onDirty()
		}

		return dispatched && this.queue.length > 0
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
