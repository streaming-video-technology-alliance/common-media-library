import { describe, it } from 'node:test'
import { expectCuesEqualAll } from '../../utils/expectCuesEqualAll.ts'

describe('cuetext/format tests', () => {

	it('double-line-break.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/format/double-line-break.vtt', 'test/cuetext/format/double-line-break.json')
	})

	it('line-breaks.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/format/line-breaks.vtt', 'test/cuetext/format/line-breaks.json')
	})

	it('long-line.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/format/long-line.vtt', 'test/cuetext/format/long-line.json')
	})

	it('no-line-break.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/format/no-line-break.vtt', 'test/cuetext/format/no-line-break.json')
	})

	it('no-newline-at-end.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/format/no-newline-at-end.vtt', 'test/cuetext/format/no-newline-at-end.json')
	})

})
