import { Queue } from './Queue.ts'

/**
 * An async wrapper around a `SourceBuffer`.
 *
 * @remarks
 *
 * `SourceBuffer` can be hard to work with: a lot of its methods and
 * properties execute synchronously, but their operation is actually
 * asynchronous. The buffer maintains an `updating` property that needs to
 * be strictly respected, and most methods and
 * properties on the source buffer should only be called when the buffer is
 * not currently updating. Events need to be listened to in order to find
 * the right moment when the next operation on the buffer can be executed.
 *
 * `AsyncSourceBuffer` wraps a provided source buffer and exposes its API
 * through async methods instead.
 *
 * The implementation attaches listeners to the provided `SourceBuffer`, so
 * you need to call {@link AsyncSourceBuffer.release} when you are done.
 *
 * The methods of this class that operate on the buffer are async and
 * return a promise that resolves to a boolean.
 *
 * The promise resolves when the action was executed successfully _and_ the
 * source buffer completed its operation. In case the operation was
 * aborted, i.e. `SourceBuffer.abort()` was called, the promise will
 * _not_ reject but resolve to `false`.
 *
 * The promise is rejected if an error occurred during the buffer
 * operation, i.e. the `error` event was triggered, or when the underlying
 * call throws an exception.
 *
 * If the operation was successfully executed the promise resolves with
 * `true`. Once the promise resolves successfully, the source buffer will
 * no longer be updating and the next operation, if available, will be
 * scheduled.
 *
 * This also means you don't need to wait for individual operations to
 * succeed before starting the next one — you can call multiple operations
 * and they will be queued up. If you do so, consider collecting the
 * returned promises so you can check for errors.
 *
 * @example
 * {@includeCode ../test/AsyncSourceBuffer.test.ts#example}
 *
 * @public
 */
export class AsyncSourceBuffer {
	readonly #sourceBuffer: SourceBuffer
	#queue: Queue

	/**
	 * Create a new wrapper instance around the provided buffer.
	 *
	 * @param sourceBuffer - The source buffer instance
	 */
	constructor(sourceBuffer: SourceBuffer) {
		this.#sourceBuffer = sourceBuffer
		this.#queue = new Queue(this.#sourceBuffer)
	}

	/**
	 * Append data to the buffer.
	 *
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SourceBuffer/appendBuffer}
	 * @see {@link https://w3c.github.io/media-source/#dom-sourcebuffer-appendbuffer}
	 *
	 * @param data - An `ArrayBuffer`, a `TypedArray` or a `DataView`
	 * containing the media segment data to add to the source buffer
	 * @returns Promise that resolves once the append was completed
	 */
	async appendBuffer(data: BufferSource): Promise<boolean> {
		return this.#queue.add(() => {
			this.#sourceBuffer.appendBuffer(data)
		})
	}

	/**
	 * Remove data from the buffer.
	 *
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SourceBuffer/remove}
	 * @see {@link https://w3c.github.io/media-source/#dom-sourcebuffer-remove}
	 *
	 * @param start - The start of the range to remove, in seconds
	 * @param end - The end of the range to remove, in seconds
	 * @returns Promise that resolves once the remove was completed
	 */
	async remove(start: number, end: number): Promise<boolean> {
		return this.#queue.add(() => {
			this.#sourceBuffer.remove(start, end)
		})
	}

	/**
	 * Sets the MIME type that future calls to `appendBuffer` should expect
	 * the new media data to conform to. This makes it possible to change
	 * codecs or container type mid-stream.
	 *
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SourceBuffer/changeType}
	 * @see {@link https://w3c.github.io/media-source/#dom-sourcebuffer-changetype}
	 *
	 * @param type - The MIME type that future buffers will conform to
	 * @returns Promise that resolves once the type change was completed
	 */
	async changeType(type: string): Promise<boolean> {
		return this.#queue.add(() => {
			this.#sourceBuffer.changeType(type)
		})
	}

	/**
	 * Set the end of the append window.
	 *
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SourceBuffer/appendWindowEnd}
	 * @see {@link https://w3c.github.io/media-source/#dom-sourcebuffer-appendwindowend}
	 *
	 * @param value - The append window end time, in seconds
	 * @returns Promise that resolves once the change was completed
	 */
	async appendWindowEnd(value: number): Promise<boolean> {
		return this.#queue.add(() => {
			this.#sourceBuffer.appendWindowEnd = value
		})
	}

	/**
	 * Set the start of the append window.
	 *
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SourceBuffer/appendWindowStart}
	 * @see {@link https://w3c.github.io/media-source/#dom-sourcebuffer-appendwindowstart}
	 *
	 * @param value - The append window start time, in seconds
	 * @returns Promise that resolves once the change was completed
	 */
	async appendWindowStart(value: number): Promise<boolean> {
		return this.#queue.add(() => {
			this.#sourceBuffer.appendWindowStart = value
		})
	}

	/**
	 * Set the timestamp offset.
	 *
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SourceBuffer/timestampOffset}
	 * @see {@link https://w3c.github.io/media-source/#dom-sourcebuffer-timestampoffset}
	 *
	 * @param value - The new timestamp offset, in seconds
	 * @returns Promise that resolves once the change was completed
	 */
	async timestampOffset(value: number): Promise<boolean> {
		return this.#queue.add(() => {
			this.#sourceBuffer.timestampOffset = value
		})
	}

	/**
	 * Set the source buffer mode.
	 *
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SourceBuffer/mode}
	 * @see {@link https://w3c.github.io/media-source/#dom-sourcebuffer-mode}
	 *
	 * @param value - The append mode
	 * @returns Promise that resolves once the change was completed
	 */
	async mode(value: AppendMode): Promise<boolean> {
		return this.#queue.add(() => {
			this.#sourceBuffer.mode = value
		})
	}

	/**
	 * Get the currently buffered range.
	 *
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SourceBuffer/buffered}
	 * @see {@link https://w3c.github.io/media-source/#dom-sourcebuffer-buffered}
	 *
	 * @returns The currently buffered range
	 */
	get buffered(): TimeRanges {
		return this.#sourceBuffer.buffered
	}

	/**
	 * Abort any currently ongoing operation on the source buffer.
	 *
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/SourceBuffer/abort}
	 * @see {@link https://w3c.github.io/media-source/#dom-sourcebuffer-abort}
	 *
	 * @param clearQueue - If `true`, the job queue is also cleared, i.e. any
	 * pending jobs are removed and resolved with `false`
	 */
	abort(clearQueue = false): void {
		if (clearQueue) {
			this.#queue.clear()
		}
		this.#sourceBuffer.abort()
	}

	/**
	 * Clear the buffer completely.
	 *
	 * @remarks
	 *
	 * This is an extension to the native source buffer API. It removes the
	 * full buffered range and can optionally also remove any pending jobs
	 * from the job queue.
	 *
	 * @param clearQueue - If `true`, the job queue is also cleared, i.e. any
	 * pending jobs are removed and resolved with `false`
	 * @returns Promise that resolves once the clear was completed
	 */
	async clear(clearQueue = false): Promise<boolean> {
		if (clearQueue) {
			this.#queue.clear()
		}
		return this.#queue.add(() => {
			const buffered = this.#sourceBuffer.buffered
			if (buffered.length > 0) {
				const start = buffered.start(0)
				const end = buffered.end(buffered.length - 1)
				this.#sourceBuffer.remove(start, end)
			}
		})
	}

	/**
	 * Remove any pending (not yet started) jobs from the queue, resolving
	 * them with `false`. Does not affect a job that is already running.
	 */
	clearQueue(): void {
		this.#queue.clear()
	}

	/**
	 * Release this instance. Removes the listeners attached to the source
	 * buffer and clears the queue. The instance cannot be used once it has
	 * been released.
	 */
	release(): void {
		this.#queue.release()
	}
}
