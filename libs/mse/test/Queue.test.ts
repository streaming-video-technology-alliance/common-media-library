import type { action } from '../src/action.ts'
import { Queue } from '../src/Queue.ts'
import { equal, ok, throws } from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { MockSourceBuffer } from './MockSourceBuffer.ts'

describe('Queue Tests', () => {
	let mockSourceBuffer: MockSourceBuffer
	let queue: Queue

	beforeEach(() => {
		mockSourceBuffer = new MockSourceBuffer()
		queue = new Queue(mockSourceBuffer)
	})

	afterEach(() => {
		queue.release()
	})

	it('resolves a simple action with true on updateend', async () => {
		const testAction: action = () => {
			mockSourceBuffer.updating = true
			setTimeout(() => mockSourceBuffer.simulateUpdateEnd(), 10)
		}

		const result = await queue.add(testAction)
		equal(result, true)
	})

	it('rejects if the action throws synchronously', async () => {
		const errorAction: action = () => {
			throw new Error('Test error')
		}

		try {
			await queue.add(errorAction)
			throw new Error('Expected promise to reject, but it resolved')
		} catch (err) {
			ok(err instanceof Error)
			equal(err.message, 'Test error')
		}
	})

	it('rejects if the source buffer fires an "error" event', async () => {
		const errorAction: action = () => {
			mockSourceBuffer.updating = true
			setTimeout(() => mockSourceBuffer.simulateError(), 10)
		}

		try {
			await queue.add(errorAction)
			throw new Error('Expected promise to reject, but it resolved')
		} catch (err) {
			equal(err, 'source buffer error')
		}
	})

	it('resolves with false when the operation is aborted', async () => {
		const abortAction: action = () => {
			mockSourceBuffer.updating = true
			setTimeout(() => mockSourceBuffer.simulateAbort(), 10)
		}

		const result = await queue.add(abortAction)
		equal(result, false)
	})

	it('resolves with false when the active job is forcibly aborted via clear()', async () => {
		const someAction: action = () => {
			mockSourceBuffer.updating = true
		}

		const resultPromise = queue.add(someAction)
		queue.clear()

		const result = await resultPromise
		equal(result, false)
	})

	it('runs actions strictly in order', async () => {
		const order: number[] = []
		const makeAction = (id: number): action => () => {
			mockSourceBuffer.updating = true
			order.push(id)
			setTimeout(() => mockSourceBuffer.simulateUpdateEnd(), 10)
		}

		const first = queue.add(makeAction(1))
		const second = queue.add(makeAction(2))
		await Promise.all([first, second])

		equal(order.length, 2)
		equal(order[0], 1)
		equal(order[1], 2)
	})

	it('throws when adding to a released queue', () => {
		queue.release()

		throws(() => {
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			void queue.add(() => {})
		}, /released/)
	})
})
