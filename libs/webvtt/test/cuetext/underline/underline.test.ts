import { describe, it } from 'node:test'
import { expectCuesEqualAll } from '../../utils/expectCuesEqualAll.ts'

describe('cuetext/underline tests', () => {

	it('not-closed.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/underline/not-closed.vtt', 'test/cuetext/underline/not-closed.json')
	})

	it('with-annotation.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/underline/with-annotation.vtt', 'test/cuetext/underline/with-annotation.json')
	})

	it('with-closing-span.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/underline/with-closing-span.vtt', 'test/cuetext/underline/with-closing-span.json')
	})

	it('with-subclass.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/underline/with-subclass.vtt', 'test/cuetext/underline/with-subclass.json')
	})

	it('with-two-subclasses.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/underline/with-two-subclasses.vtt', 'test/cuetext/underline/with-two-subclasses.json')
	})

})
