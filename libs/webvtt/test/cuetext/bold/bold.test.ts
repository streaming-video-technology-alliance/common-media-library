import { describe, it } from 'node:test'
import { expectCuesEqualAll } from '../../utils/expectCuesEqualAll.ts'

describe('cuetext/bold tests', () => {

	it('not-closed.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/bold/not-closed.vtt', 'test/cuetext/bold/not-closed.json')
	})

	it('with-annotation.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/bold/with-annotation.vtt', 'test/cuetext/bold/with-annotation.json')
	})

	it('with-closing-span.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/bold/with-closing-span.vtt', 'test/cuetext/bold/with-closing-span.json')
	})

	it('with-subclass.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/bold/with-subclass.vtt', 'test/cuetext/bold/with-subclass.json')
	})

	it('with-two-subclasses.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/bold/with-two-subclasses.vtt', 'test/cuetext/bold/with-two-subclasses.json')
	})

})
