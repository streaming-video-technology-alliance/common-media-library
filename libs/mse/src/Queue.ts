import type { action } from './action.ts'

/**
 * A job queue that queues up actions and executes them in order whenever
 * the provided `SourceBuffer` is ready to process actions, i.e. is
 * not `updating`.
 *
 * @remarks
 *
 * The implementation attaches listeners to the source buffer. You need to
 * make sure that you call {@link Queue.release} when you are done.
 *
 * The primary method of the queue is {@link Queue.add}. It takes an action,
 * queues it up and returns a Promise. The promise resolves when the action
 * was executed successfully _and_ the source buffer completed its
 * operation. This means that for an action to complete, the buffer should
 * trigger either an `updateend`, `abort` or `error` event.
 *
 * The promise is rejected if an error occurred during the buffer operation,
 * i.e. the `error` event was triggered, or when the action throws an
 * exception.
 *
 * In case the operation was aborted, i.e. `SourceBuffer.abort()` was
 * called, the promise will _not_ reject but resolve with `false`. This
 * happens when the buffer dispatches the `abort` event or an `AbortError`
 * is thrown.
 *
 * If the operation was successfully executed the promise resolves with
 * `true`. Once the promise resolves successfully, the source buffer will no
 * longer be updating and the next operation, if available, will be
 * scheduled.
 *
 * @internal
 */
export class Queue {
	readonly #sourceBuffer: SourceBuffer
	#elements: Job[] = []
	#active?: Job
	#released = false

	readonly #onCompletedListener = (e: Event) => {
		const aborted = e.type === 'abort'
		const error = e.type === 'error'
		this.#onCompleted(error, aborted)
	}

	/**
	 * Create a new instance of the queue.
	 *
	 * @remarks
	 *
	 * Listeners are attached to the source buffer, so don't forget to call
	 * {@link Queue.release} when you are done.
	 *
	 * @param sourceBuffer - The source buffer
	 */
	constructor(sourceBuffer: SourceBuffer) {
		this.#sourceBuffer = sourceBuffer
		sourceBuffer.addEventListener('updateend', this.#onCompletedListener)
		sourceBuffer.addEventListener('abort', this.#onCompletedListener)
		sourceBuffer.addEventListener('error', this.#onCompletedListener)
	}

	/**
	 * Release this instance.
	 *
	 * @remarks
	 *
	 * This clears the queue, aborts any active or pending jobs, and removes
	 * any listeners attached to the source buffer. The instance cannot be
	 * used once it has been released.
	 */
	release(): void {
		this.clear()
		this.#released = true
		this.#sourceBuffer.removeEventListener('updateend', this.#onCompletedListener)
		this.#sourceBuffer.removeEventListener('abort', this.#onCompletedListener)
		this.#sourceBuffer.removeEventListener('error', this.#onCompletedListener)
	}

	/**
	 * Add an action to the queue.
	 *
	 * @throws An error if the queue was already released
	 * @param action - The action
	 * @returns The promise that resolves when the action was completed
	 */
	add(action: action): Promise<boolean> {
		this.#checkReleased()
		const job = new Job(action)
		this.#elements.push(job)
		this.#process()
		return job.promise
	}

	/**
	 * Clear the active job and the queue.
	 *
	 * @remarks
	 *
	 * This only resolves the pending/active jobs' promises with `false`. It
	 * does _not_ abort any operation already running on the source buffer.
	 */
	clear(): void {
		for (const job of this.#elements) {
			job.abort()
		}
		this.#elements = []

		if (this.#active) {
			this.#active.abort()
		}
		this.#active = undefined
	}

	#onCompleted(receivedError: boolean, receivedAborted: boolean): void {
		if (this.#active) {
			this.#active.complete(receivedError, receivedAborted)
		}
		this.#active = undefined
		this.#process()
	}

	#process(): void {
		// If we are processing an active job or the source buffer is
		// updating, we have to wait.
		if (this.#active || this.#sourceBuffer.updating) {
			return
		}

		this.#active = this.#elements.shift()
		if (this.#active) {
			this.#active.run()
		}
	}

	#checkReleased(): void {
		if (this.#released) {
			throw new Error('released')
		}
	}
}

class Job {
	readonly promise: Promise<boolean>
	readonly #action: action
	#resolve!: (success: boolean) => void
	#reject!: (reason?: unknown) => void
	#error: unknown
	#completed = false

	constructor(action: action) {
		this.#action = action
		this.promise = new Promise<boolean>((resolve, reject) => {
			this.#resolve = resolve
			this.#reject = reject
		})
	}

	/**
	 * Starts the action and catches any errors.
	 */
	run(): void {
		try {
			this.#action()
		} catch (e) {
			this.#error = e
			throw e
		}
	}

	/**
	 * Call this when the action was completed, i.e. the source buffer is no
	 * longer updating.
	 */
	complete(receivedError: boolean, receivedAborted: boolean): void {
		if (this.#completed) {
			return
		}
		this.#completed = true

		if (this.#error) {
			if (isAbortError(this.#error)) {
				this.#resolve(false)
			} else {
				this.#reject(this.#error)
			}
			return
		}

		if (receivedAborted) {
			this.#resolve(false)
			return
		}

		if (receivedError) {
			this.#reject('source buffer error')
			return
		}

		this.#resolve(true)
	}

	abort(): void {
		this.#resolve(false)
	}
}

function isAbortError(e: unknown): boolean {
	return e instanceof DOMException && e.name === 'AbortError'
}
