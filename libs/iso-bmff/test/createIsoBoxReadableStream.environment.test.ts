import { strictEqual, throws } from 'node:assert'
import { describe, it } from 'vite-plus/test'

// Do not import @svta/cml-iso-bmff statically. The test must evaluate the module after it removes ReadableStream.

describe('createIsoBoxReadableStream in a runtime without ReadableStream', () => {
	it('throws with no ReadableStream, and uses a ReadableStream that the caller installs after the import', async () => {
		const NativeReadableStream = globalThis.ReadableStream

		// @ts-expect-error - simulate a runtime without the Web Streams API
		delete globalThis.ReadableStream

		try {
			const { createIsoBoxReadableStream, fourCcToUint32, writeFree } =
				await import('@svta/cml-iso-bmff')

			throws(
				() => createIsoBoxReadableStream([], { writers: {} }),
				/ReadableStream is not available in this environment/,
			)
			strictEqual(fourCcToUint32('ftyp'), 0x66747970)

			class Polyfill<R> extends NativeReadableStream<R> {}
			globalThis.ReadableStream = Polyfill as typeof ReadableStream

			const stream = createIsoBoxReadableStream([{ type: 'free', data: new Uint8Array([1]) }], {
				writers: { free: writeFree },
			})
			const chunks: Uint8Array[] = []

			for await (const chunk of stream) {
				chunks.push(chunk)
			}

			strictEqual(stream instanceof Polyfill, true)
			strictEqual(chunks.length, 1)
			strictEqual(chunks[0].byteLength, 9)
		} finally {
			globalThis.ReadableStream = NativeReadableStream
		}
	})
})
