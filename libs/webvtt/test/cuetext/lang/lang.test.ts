import { describe, it } from 'node:test'
import { expectCuesEqualAll } from '../../utils/expectCuesEqualAll.ts'

describe('cuetext/lang tests', () => {

	it('no-end-gt.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/lang/no-end-gt.vtt', 'test/cuetext/lang/no-end-gt.json')
	})

	it('not-closed.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/lang/not-closed.vtt', 'test/cuetext/lang/not-closed.json')
	})

	it('with-annotation.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/lang/with-annotation.vtt', 'test/cuetext/lang/with-annotation.json')
	})

	it('with-closing-span.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/lang/with-closing-span.vtt', 'test/cuetext/lang/with-closing-span.json')
	})

	it('with-no-annotation.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/lang/with-no-annotation.vtt', 'test/cuetext/lang/with-no-annotation.json')
	})

	it('with-subclass.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/lang/with-subclass.vtt', 'test/cuetext/lang/with-subclass.json')
	})

	it('with-two-subclasses.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/lang/with-two-subclasses.vtt', 'test/cuetext/lang/with-two-subclasses.json')
	})

})
