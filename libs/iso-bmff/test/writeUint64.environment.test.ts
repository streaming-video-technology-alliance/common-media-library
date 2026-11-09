import { equal, throws } from 'node:assert'
import { describe, it } from 'vite-plus/test'

// This file must not import @svta/cml-iso-bmff statically: the module has to be
// evaluated for the first time after BigInt has been removed to simulate a
// runtime without BigInt.

describe('IsoBoxWriteView.writeUint64 in a runtime without BigInt', () => {
	it('can be imported, and only writeUint64 throws', async () => {
		const NativeBigInt = globalThis.BigInt
		const one = NativeBigInt(1)

		// @ts-expect-error - simulate a runtime without BigInt
		delete globalThis.BigInt

		try {
			const { fourCcToUint32, IsoBoxWriteView } = await import('@svta/cml-iso-bmff')

			const writer = new IsoBoxWriteView('test', 16)
			writer.writeUint(1, 8)
			equal(new Uint8Array(writer.buffer)[15], 1)

			throws(() => new IsoBoxWriteView('test', 16).writeUint64(one), ReferenceError)

			// Exports that do not use BigInt remain fully usable
			equal(fourCcToUint32('ftyp'), 0x66747970)
		} finally {
			globalThis.BigInt = NativeBigInt
		}
	})
})
