import { describe, it } from 'node:test'
import { expectCuesEqualAll } from '../../utils/expectCuesEqualAll.ts'

describe('cue-settings/vertical tests', () => {

	it('bogus-value.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/vertical/bogus-value.vtt', './test/webvtt/cue-settings/vertical/bad-vertical.json')
	})

	it('capital-keyword.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/vertical/capital-keyword.vtt', './test/webvtt/cue-settings/vertical/bad-vertical.json')
	})

	// TODO: Turn back on in https://github.com/mozilla/vtt.js/issues/243
	it('correct-lr-keyword.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/vertical/correct-lr-keyword.vtt', './test/webvtt/cue-settings/vertical/correct-lr-keyword.json')
	})

	// TODO: Turn back on in https://github.com/mozilla/vtt.js/issues/243
	it('correct-rl-keyword.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/vertical/correct-rl-keyword.vtt', './test/webvtt/cue-settings/vertical/correct-rl-keyword.json')
	})

	it('incorrect-delimiter.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/vertical/incorrect-delimiter.vtt', './test/webvtt/cue-settings/vertical/bad-vertical.json')
	})

	it('incorrect-keyword.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/vertical/incorrect-keyword.vtt', './test/webvtt/cue-settings/vertical/bad-vertical.json')
	})

	it('no-value.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/vertical/no-value.vtt', './test/webvtt/cue-settings/vertical/bad-vertical.json')
	})

	it('space-after-delimiter.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/vertical/space-after-delimiter.vtt', './test/webvtt/cue-settings/vertical/bad-vertical.json')
	})

	it('space-before-delimiter.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/vertical/space-before-delimiter.vtt', './test/webvtt/cue-settings/vertical/bad-vertical.json')
	})

})
