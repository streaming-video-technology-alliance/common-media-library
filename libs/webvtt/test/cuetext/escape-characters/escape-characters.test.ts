import { describe, it } from 'node:test'
import { expectCuesEqualAll } from '../../utils/expectCuesEqualAll.ts'

describe('cuetext/escape-characters tests', () => {

	it('amp.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/escape-characters/amp.vtt', 'test/cuetext/escape-characters/amp.json')
	})

	it('gt.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/escape-characters/gt.vtt', 'test/cuetext/escape-characters/gt.json')
	})

	it('incorrect.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/escape-characters/incorrect.vtt', 'test/cuetext/escape-characters/incorrect.json')
	})

	it('lrm.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/escape-characters/lrm.vtt', 'test/cuetext/escape-characters/lrm.json')
	})

	it('lt.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/escape-characters/lt.vtt', 'test/cuetext/escape-characters/lt.json')
	})

	it('nbsp.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/escape-characters/nbsp.vtt', 'test/cuetext/escape-characters/nbsp.json')
	})

	it('rlm.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/escape-characters/rlm.vtt', 'test/cuetext/escape-characters/rlm.json')
	})

	it('together.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/escape-characters/together.vtt', 'test/cuetext/escape-characters/together.json')
	})

})
