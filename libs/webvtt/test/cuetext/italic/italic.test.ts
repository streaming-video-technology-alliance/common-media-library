import { describe, it } from 'node:test'
import { expectCuesEqualAll } from '../../utils/expectCuesEqualAll.ts'

describe('cuetext/italic tests', () => {

	it('not-closed.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/italic/not-closed.vtt', 'test/cuetext/italic/not-closed.json')
	})

	it('with-annotation.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/italic/with-annotation.vtt', 'test/cuetext/italic/with-annotation.json')
	})

	it('with-closing-span.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/italic/with-closing-span.vtt', 'test/cuetext/italic/with-closing-span.json')
	})

	it('with-subclass.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/italic/with-subclass.vtt', 'test/cuetext/italic/with-subclass.json')
	})

	it('with-two-subclasses.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/italic/with-two-subclasses.vtt', 'test/cuetext/italic/with-two-subclasses.json')
	})

})
