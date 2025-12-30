import { describe, it } from 'node:test'
import { expectCuesEqualAll } from '../../utils/expectCuesEqualAll.ts'

describe('cuetext/tag-format tests', () => {

	it('bogus-span-name.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/tag-format/bogus-span-name.vtt', 'test/cuetext/tag-format/bogus-span-name.json')
	})

	it('end-tag-no-gt.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/tag-format/end-tag-no-gt.vtt', 'test/cuetext/tag-format/end-tag-no-gt.json')
	})

	it('incorrect-close-tag-order.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/tag-format/incorrect-close-tag-order.vtt', 'test/cuetext/tag-format/incorrect-close-tag-order.json')
	})

	it('no-closing-gt', async () => {
		await expectCuesEqualAll('test/cuetext/tag-format/no-closing-gt.vtt', 'test/cuetext/tag-format/no-closing-gt.json')
	})

	it('no-start-tag.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/tag-format/no-start-tag.vtt', 'test/cuetext/tag-format/no-start-tag.json')
	})

	it('start-tag-missing-gt.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/tag-format/start-tag-missing-gt.vtt', 'test/cuetext/tag-format/start-tag-missing-gt.json')
	})

})
