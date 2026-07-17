import { AsyncSourceBuffer } from '@svta/cml-mse'
import { equal, ok } from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { MockSourceBuffer } from './MockSourceBuffer.ts'

describe('AsyncSourceBuffer Tests', () => {
	let mockSourceBuffer: MockSourceBuffer
	let asyncSourceBuffer: AsyncSourceBuffer

	beforeEach(() => {
		mockSourceBuffer = new MockSourceBuffer()
		asyncSourceBuffer = new AsyncSourceBuffer(mockSourceBuffer)
	})

	afterEach(() => {
		asyncSourceBuffer.release()
	})

	it('appends data via appendBuffer()', async () => {
		const appendPromise = asyncSourceBuffer.appendBuffer(new Uint8Array([0, 1, 2, 3]))
		mockSourceBuffer.simulateUpdateEnd()
		const result = await appendPromise
		equal(result, true)
	})

	it('removes data via remove(start, end)', async () => {
		const removePromise = asyncSourceBuffer.remove(0, 10)
		mockSourceBuffer.simulateUpdateEnd()
		const result = await removePromise
		equal(result, true)
	})

	it('changes the source buffer type via changeType()', async () => {
		const changeTypePromise = asyncSourceBuffer.changeType('video/mp4; codecs="avc1.640028"')
		mockSourceBuffer.simulateUpdateEnd()
		const result = await changeTypePromise
		equal(result, true)
	})

	it('sets appendWindowEnd', async () => {
		const promise = asyncSourceBuffer.appendWindowEnd(20)
		mockSourceBuffer.simulateUpdateEnd()
		const result = await promise
		equal(mockSourceBuffer.appendWindowEnd, 20)
		equal(result, true)
	})

	it('sets appendWindowStart', async () => {
		const promise = asyncSourceBuffer.appendWindowStart(5)
		mockSourceBuffer.simulateUpdateEnd()
		const result = await promise
		equal(mockSourceBuffer.appendWindowStart, 5)
		equal(result, true)
	})

	it('sets timestampOffset', async () => {
		const promise = asyncSourceBuffer.timestampOffset(5.5)
		mockSourceBuffer.simulateUpdateEnd()
		const result = await promise
		equal(mockSourceBuffer.timestampOffset, 5.5)
		equal(result, true)
	})

	it('sets mode', async () => {
		const promise = asyncSourceBuffer.mode('sequence')
		mockSourceBuffer.simulateUpdateEnd()
		const result = await promise
		equal(mockSourceBuffer.mode, 'sequence')
		equal(result, true)
	})

	it('exposes buffered via a synchronous getter', () => {
		const ranges = asyncSourceBuffer.buffered
		ok(ranges)
		equal(ranges.length, 0)
	})

	it('aborts ongoing operations via abort()', () => {
		asyncSourceBuffer.abort()
		equal(mockSourceBuffer.updating, false)
	})

	it('clears the buffer via clear()', async () => {
		const clearPromise = asyncSourceBuffer.clear()
		mockSourceBuffer.simulateUpdateEnd()
		const result = await clearPromise
		equal(result, true)
	})

	it('does not throw when releasing', () => {
		asyncSourceBuffer.release()
	})

	it('provides a usage example', async () => {
		const sourceBuffer = new MockSourceBuffer()
		// Drive every queued operation to completion, mimicking a real
		// `SourceBuffer` firing `updateend` once its update finishes.
		const nativeAppendBuffer = sourceBuffer.appendBuffer.bind(sourceBuffer)
		sourceBuffer.appendBuffer = () => {
			nativeAppendBuffer()
			queueMicrotask(() => sourceBuffer.simulateUpdateEnd())
		}

		const initSegment = new Uint8Array([0, 1, 2, 3])
		const mediaSegment = new Uint8Array([4, 5, 6, 7])

		//#region example
		const asyncSourceBuffer = new AsyncSourceBuffer(sourceBuffer)

		await asyncSourceBuffer.appendBuffer(initSegment)
		await asyncSourceBuffer.appendBuffer(mediaSegment)

		asyncSourceBuffer.release()
		//#endregion example
	})
})
