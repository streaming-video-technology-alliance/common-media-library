import { describe, it } from 'node:test'
import { expectCuesEqualAll } from '../../utils/expectCuesEqualAll.ts'

describe('cuetext/ruby tests', () => {

	it('basic.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/ruby/basic.vtt', './test/webvtt/cuetext/ruby/basic.json')
	})

	it('rt-no-end-tag.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/ruby/rt-no-end-tag.vtt', './test/webvtt/cuetext/ruby/rt-no-end-tag.json')
	})

	it('rt-no-ruby-tag.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/ruby/rt-no-ruby-tag.vtt', './test/webvtt/cuetext/ruby/rt-no-ruby-tag.json')
	})

	it('ruby-rt-no-end-tag.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/ruby/ruby-rt-no-end-tag.vtt', './test/webvtt/cuetext/ruby/ruby-rt-no-end-tag.json')
	})

	it('with-annotation.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/ruby/with-annotation.vtt', './test/webvtt/cuetext/ruby/with-annotation.json')
	})

	it('with-closing-span.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/ruby/with-closing-span.vtt', './test/webvtt/cuetext/ruby/with-closing-span.json')
	})

	it('with-subclass.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/ruby/with-subclass.vtt', './test/webvtt/cuetext/ruby/with-subclass.json')
	})

	it('with-two-subclasses.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/ruby/with-two-subclasses.vtt', './test/webvtt/cuetext/ruby/with-two-subclasses.json')
	})

})
