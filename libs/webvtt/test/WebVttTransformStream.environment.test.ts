import { equal, throws } from 'node:assert'
import { describe, it } from 'node:test'

// This file must not import @svta/cml-webvtt statically: the module has to be
// evaluated for the first time after TransformStream has been removed to
// simulate a runtime without the Web Streams API.

describe('WebVttTransformStream in a runtime without TransformStream', () => {
	it('can be imported, and instantiation throws a descriptive error', async () => {
		const NativeTransformStream = globalThis.TransformStream

		// @ts-expect-error - simulate a runtime without the Web Streams API
		delete globalThis.TransformStream

		try {
			const { parseWebVtt, WebVttTransformStream } = await import('@svta/cml-webvtt')

			equal(typeof WebVttTransformStream, 'function')
			throws(() => new WebVttTransformStream(), /TransformStream is not available in this environment/)

			// Non-stream exports remain fully usable
			const { cues } = await parseWebVtt('WEBVTT\n\n00:00:00.000 --> 00:00:01.000\ntest')
			equal(cues.length, 1)
		} finally {
			globalThis.TransformStream = NativeTransformStream
		}
	})
})
