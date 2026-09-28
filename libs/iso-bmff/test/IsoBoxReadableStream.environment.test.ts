import { equal, throws } from 'node:assert'
import { describe, it } from 'node:test'

// This file must not import @svta/cml-iso-bmff statically: the module has to be
// evaluated for the first time after ReadableStream has been removed to
// simulate a runtime without the Web Streams API.

describe('IsoBoxReadableStream in a runtime without ReadableStream', () => {
	it('can be imported, and instantiation throws a descriptive error', async () => {
		const NativeReadableStream = globalThis.ReadableStream

		// @ts-expect-error - simulate a runtime without the Web Streams API
		delete globalThis.ReadableStream

		try {
			const { fourCcToUint32, IsoBoxReadableStream } = await import('@svta/cml-iso-bmff')

			equal(typeof IsoBoxReadableStream, 'function')
			throws(() => new IsoBoxReadableStream([], { writers: {} }), /ReadableStream is not available in this environment/)

			// Non-stream exports remain fully usable
			equal(fourCcToUint32('ftyp'), 0x66747970)
		} finally {
			globalThis.ReadableStream = NativeReadableStream
		}
	})
})
