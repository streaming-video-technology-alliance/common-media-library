import { strictEqual, throws } from 'node:assert'
import { describe, it } from 'vite-plus/test'

// This file must not import @svta/cml-iso-bmff statically: the module has to be
// evaluated for the first time after BigInt has been removed to simulate a
// runtime without BigInt.

describe('writeUint64 in a runtime without BigInt', () => {
	it('can be imported, and only writeUint64 throws', async () => {
		const NativeBigInt = globalThis.BigInt
		const one = NativeBigInt(1)

		// @ts-expect-error - simulate a runtime without BigInt
		delete globalThis.BigInt

		try {
			const { createIsoBoxWriteCursor, isContainer, writeUint64, writeWideUint } =
				await import('@svta/cml-iso-bmff')

			const cursor = createIsoBoxWriteCursor()
			writeWideUint(cursor, 1, 8)
			strictEqual(cursor.bytes[7], 1)

			throws(() => writeUint64(createIsoBoxWriteCursor(), one), ReferenceError)

			// Exports that do not use BigInt remain fully usable
			strictEqual(isContainer({ type: 'moov' }), true)
		} finally {
			globalThis.BigInt = NativeBigInt
		}
	})
})
