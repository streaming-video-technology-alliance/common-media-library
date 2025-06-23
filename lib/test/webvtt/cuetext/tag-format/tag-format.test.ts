import { describe, it } from 'node:test';
import { expectCuesEqualAll } from '../../utils/expectCuesEqualAll.ts';

describe('cuetext/tag-format tests', () => {

	it('bogus-span-name.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/tag-format/bogus-span-name.vtt', './test/webvtt/cuetext/tag-format/bogus-span-name.json');
	});

	it('end-tag-no-gt.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/tag-format/end-tag-no-gt.vtt', './test/webvtt/cuetext/tag-format/end-tag-no-gt.json');
	});

	it('incorrect-close-tag-order.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/tag-format/incorrect-close-tag-order.vtt', './test/webvtt/cuetext/tag-format/incorrect-close-tag-order.json');
	});

	it('no-closing-gt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/tag-format/no-closing-gt.vtt', './test/webvtt/cuetext/tag-format/no-closing-gt.json');
	});

	it('no-start-tag.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/tag-format/no-start-tag.vtt', './test/webvtt/cuetext/tag-format/no-start-tag.json');
	});

	it('start-tag-missing-gt.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/tag-format/start-tag-missing-gt.vtt', './test/webvtt/cuetext/tag-format/start-tag-missing-gt.json');
	});

});
