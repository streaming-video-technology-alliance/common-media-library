import { describe, it } from 'node:test'
import { expectCuesEqualAll } from '../../utils/expectCuesEqualAll.ts'

describe('cuetext/voice tests', () => {

	it('no-end-gt.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/voice/no-end-gt.vtt', 'test/cuetext/voice/no-end-gt.json')
	})

	it('not-closed.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/voice/not-closed.vtt', 'test/cuetext/voice/not-closed.json')
	})

	it('with-annotation.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/voice/with-annotation.vtt', 'test/cuetext/voice/with-annotation.json')
	})

	it('with-closing-span.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/voice/with-closing-span.vtt', 'test/cuetext/voice/with-closing-span.json')
	})

	it('with-subclass.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/voice/with-subclass.vtt', 'test/cuetext/voice/with-subclass.json')
	})

	it('with-two-subclasses.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/voice/with-two-subclasses.vtt', 'test/cuetext/voice/with-two-subclasses.json')
	})

})
