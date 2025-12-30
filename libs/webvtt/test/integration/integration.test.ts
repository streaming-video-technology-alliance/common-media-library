import { describe, it } from 'node:test'
import { expectCuesEqualAll } from '../utils/expectCuesEqualAll.ts'

describe('integration tests', () => {

	it('arrows.vtt', async () => {
		await expectCuesEqualAll('test/integration/arrows.vtt', 'test/integration/arrows.json')
	})

	it('cue-content-class.vtt', async () => {
		await expectCuesEqualAll('test/integration/cue-content-class.vtt', 'test/integration/cue-content-class.json')
	})

	it('cue-content.vtt', async () => {
		await expectCuesEqualAll('test/integration/cue-content.vtt', 'test/integration/cue-content.json')
	})

	it('cue-identifier.vtt', async () => {
		await expectCuesEqualAll('test/integration/cue-identifier.vtt', 'test/integration/cue-identifier.json')
	})

	// Turn back on: https://github.com/mozilla/vtt.js/issues/262
	it('cycle-collector-talk.vtt', async () => {
		await expectCuesEqualAll('test/integration/cycle-collector-talk.vtt', 'test/integration/cycle-collector-talk.json')
	})

	// Turn back on: https://github.com/mozilla/vtt.js/issues/262
	it('id.vtt', async () => {
		await expectCuesEqualAll('test/integration/id.vtt', 'test/integration/id.json')
	})

	// Turn back on: https://github.com/mozilla/vtt.js/issues/262
	it('not-only-nested-cues.vtt', async () => {
		await expectCuesEqualAll('test/integration/not-only-nested-cues.vtt', 'test/integration/not-only-nested-cues.json')
	})

	// Turn back on: https://github.com/mozilla/vtt.js/issues/262
	it('one-line-comment.vtt', async () => {
		await expectCuesEqualAll('test/integration/one-line-comment.vtt', 'test/integration/one-line-comment.json')
	})

	// Turn back on: https://github.com/mozilla/vtt.js/issues/262
	it('only-nested-cues.vtt', async () => {
		await expectCuesEqualAll('test/integration/only-nested-cues.vtt', 'test/integration/only-nested-cues.json')
	})

	// Turn back on: https://github.com/mozilla/vtt.js/issues/262
	it('spec-example.vtt', async () => {
		await expectCuesEqualAll('test/integration/spec-example.vtt', 'test/integration/spec-example.json')
	})

})
