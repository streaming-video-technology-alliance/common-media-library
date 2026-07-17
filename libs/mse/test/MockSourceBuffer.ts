/**
 * A hand-rolled `SourceBuffer` fake used by this package's unit tests.
 *
 * `SourceBuffer` cannot be constructed outside of a real `MediaSource` in a
 * browser, so tests drive this fake's `updating` flag and dispatch the same
 * `updateend`/`abort`/`error` events a real buffer would.
 */
export class MockSourceBuffer extends EventTarget implements SourceBuffer {
	onabort: ((this: SourceBuffer, ev: Event) => unknown) | null = null
	onerror: ((this: SourceBuffer, ev: Event) => unknown) | null = null
	onupdate: ((this: SourceBuffer, ev: Event) => unknown) | null = null
	onupdateend: ((this: SourceBuffer, ev: Event) => unknown) | null = null
	onupdatestart: ((this: SourceBuffer, ev: Event) => unknown) | null = null

	mode: AppendMode = 'segments'
	updating = false
	buffered: TimeRanges = {
		length: 0,
		start: () => 0,
		end: () => 0,
	} as TimeRanges
	timestampOffset = 0
	appendWindowStart = 0
	appendWindowEnd: number = Infinity

	abort(): void {
		this.updating = false
		this.dispatchEvent(new Event('abort'))
	}

	remove(): void {
		this.updating = true
	}

	appendBuffer(): void {
		this.updating = true
	}

	changeType(): void {
		this.updating = true
	}

	/** Simulates the buffer completing its current update successfully. */
	simulateUpdateEnd(): void {
		this.updating = false
		this.dispatchEvent(new Event('updateend'))
	}

	/** Simulates the buffer's current update being aborted. */
	simulateAbort(): void {
		this.updating = false
		this.dispatchEvent(new Event('abort'))
	}

	/** Simulates the buffer's current update failing. */
	simulateError(): void {
		this.updating = false
		this.dispatchEvent(new Event('error'))
	}
}
