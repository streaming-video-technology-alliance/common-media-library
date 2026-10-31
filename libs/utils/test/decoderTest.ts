import { afterAll as after, beforeAll as before, describe } from 'vite-plus/test'

const NativeTextDecoder = TextDecoder

export function decoderTest(name: string, test: () => void): void {
	describe(`${name} with TextDecoder`, () => {
		test()
	})

	describe(`${name} without TextDecoder`, () => {
		before(() => {
			Object.assign(globalThis, { TextDecoder: undefined })
		})

		after(() => {
			globalThis.TextDecoder = NativeTextDecoder
		})

		test()
	})
}
