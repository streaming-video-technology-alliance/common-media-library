import type { HttpRequest } from '@svta/cml-utils'
import { CMCD_MIME_TYPE } from './CMCD_MIME_TYPE.ts'

export type CmcdRequester = (request: HttpRequest) => Promise<{ status: number; }>

/**
 * One event target's send pipeline: a FIFO queue of already-encoded report
 * lines, batched and POSTed to `url`, with a failed send re-queued for a
 * later pass. `onGone` and `onDirty` report status back to whatever
 * constructed this instance.
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

	/**
	 * Does not gate on `disposed`: a re-queue landing after disposal (see
	 * `process()`) still lands here, and stays unsent because a disposed
	 * outbox never sends again.
	 */
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
			// A failed send re-queues onto this same instance: whichever
			// outbox dispatched the batch is where its retry belongs, even
			// if the caller has since moved on to a differently-scoped one.
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
