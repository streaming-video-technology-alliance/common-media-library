import { strictEqual, throws } from 'node:assert'
import { describe, it } from 'vite-plus/test'

// This file must not import @svta/cml-iso-bmff statically: the module has to be
// evaluated for the first time after ReadableStream has been removed to
// simulate a runtime without the Web Streams API.

describe('createIsoBoxReadableStream in a runtime without ReadableStream', () => {
	it('can be imported, and a call with no ReadableStream throws a descriptive error', async () => {
		const NativeReadableStream = globalThis.ReadableStream

		// @ts-expect-error - simulate a runtime without the Web Streams API
		delete globalThis.ReadableStream

		try {
			const { createIsoBoxReadableStream, fourCcToUint32 } = await import('@svta/cml-iso-bmff')

			throws(
				() => createIsoBoxReadableStream([], { writers: {} }),
				/ReadableStream is not available in this environment/,
			)

			// Non-stream exports remain fully usable
			strictEqual(fourCcToUint32('ftyp'), 0x66747970)
		} finally {
			globalThis.ReadableStream = NativeReadableStream
		}
	})

	// The first test imported the module with no ReadableStream, and its finally block restored the global.
	it('uses a ReadableStream that the caller installs after the import', async () => {
		const { createIsoBoxReadableStream, writeFree } = await import('@svta/cml-iso-bmff')
		const stream = createIsoBoxReadableStream([{ type: 'free', data: new Uint8Array([1]) }], {
			writers: { free: writeFree },
		})
		const chunks: Uint8Array[] = []

		for await (const chunk of stream) {
			chunks.push(chunk)
		}

		strictEqual(stream instanceof ReadableStream, true)
		strictEqual(chunks.length, 1)
		strictEqual(chunks[0].byteLength, 9)
	})
})
