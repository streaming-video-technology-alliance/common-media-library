import { equal } from 'node:assert'
import { afterAll, beforeAll, describe, it } from 'vite-plus/test'
import { bomBytes, decodeUtf8Cases } from './decodeUtf8Cases.ts'

// This file must not import @svta/cml-utils statically: the module has to be
// evaluated for the first time after TextDecoder has been removed to simulate a
// runtime without TextDecoder.

const NativeTextDecoder = globalThis.TextDecoder

describe('decodeUtf8 in a runtime without TextDecoder', () => {
	let utils: typeof import('@svta/cml-utils')

	beforeAll(async () => {
		// @ts-expect-error - simulate a runtime without TextDecoder
		delete globalThis.TextDecoder
		utils = await import('@svta/cml-utils')
	})

	afterAll(() => {
		globalThis.TextDecoder = NativeTextDecoder
	})

	it('has no TextDecoder', () => {
		equal(typeof TextDecoder, 'undefined')
	})

	for (const { name, bytes, expected } of decodeUtf8Cases) {
		it(`decodes ${name} like TextDecoder`, () => {
			const data = new Uint8Array(bytes)
			equal(new NativeTextDecoder().decode(data), expected)
			equal(utils.decodeUtf8(data), expected)
			equal(utils.decodeUtf8(new DataView(data.buffer)), expected)
		})
	}

	it('decodes every 1-byte and 2-byte input like TextDecoder', () => {
		const native = new NativeTextDecoder()
		const data = new Uint8Array(2)

		for (let first = 0; first < 256; first++) {
			data[0] = first
			equal(utils.decodeUtf8(data.subarray(0, 1)), native.decode(data.subarray(0, 1)))

			for (let second = 0; second < 256; second++) {
				data[1] = second
				equal(utils.decodeUtf8(data), native.decode(data))
			}
		}
	})

	it('keeps a leading byte order mark like decodeText', () => {
		const data = new Uint8Array(bomBytes)
		equal(utils.decodeUtf8(data), '\ufeffhi')
		equal(utils.decodeUtf8(data), utils.decodeText(data, { encoding: utils.UTF_8 }))
	})

	it('reads only the bytes of a DataView with a byte offset', () => {
		const data = new Uint8Array([0x78, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x78])
		equal(utils.decodeUtf8(new DataView(data.buffer, 1, 5)), 'hello')
	})

	it('decodeText removes a detected byte order mark', () => {
		equal(utils.decodeText(new Uint8Array(bomBytes)), 'hi')
	})
})
