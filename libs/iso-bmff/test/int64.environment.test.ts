import { deepStrictEqual, equal, ok, throws } from 'node:assert'
import { describe, it } from 'vite-plus/test'
import { boxBytes, valueAt, WIDE_BOXES, wideValues } from './util/wideBoxes.ts'

// This file must not import @svta/cml-iso-bmff statically: the module has to be
// evaluated for the first time after BigInt has been removed to simulate a
// runtime without BigInt.

describe('int64 option in a runtime without BigInt', () => {
	it('reads and writes with no option and with the overflow function', async () => {
		const NativeBigInt = globalThis.BigInt
		// The test builds every input before it removes BigInt.
		const inputs = WIDE_BOXES.map(box => {
			const safe = wideValues(box, NativeBigInt(Number.MAX_SAFE_INTEGER) - NativeBigInt(8))
			const high = wideValues(box, NativeBigInt('18014398509481985'))
			const low = wideValues(box, NativeBigInt(1000))

			return {
				box,
				safe: { bytes: box.bytes(safe, 8), values: safe.map(Number) },
				high: { bytes: box.bytes(high, 8), values: high.map(Number) },
				low: box.fixed ? undefined : { bytes: box.bytes(low, 4), values: low.map(Number) },
			}
		})
		const tfdtV0 = boxBytes('tfdt', [0, 1], [0, 3], [1000, 4])

		// @ts-expect-error - simulate a runtime without BigInt
		delete globalThis.BigInt

		try {
			const {
				createInt64OverflowReader,
				defaultReaderConfig,
				defaultWriterConfig,
				readInt64AsBigInt,
				readIsoBoxes,
				writeIsoBox,
			} = await import('@svta/cml-iso-bmff')

			for (const { box, safe, high, low } of inputs) {
				for (const input of [safe, high, low]) {
					if (!input) {
						continue
					}

					// With no option, no code path uses BigInt.
					const [plain] = readIsoBoxes(input.bytes, defaultReaderConfig())
					let errors = 0
					const [checked] = readIsoBoxes(
						input.bytes,
						defaultReaderConfig({
							int64: createInt64OverflowReader(error => {
								ok(error instanceof RangeError)
								errors++
							}),
						}),
					)

					ok(plain && checked)

					for (const [i, path] of box.paths.entries()) {
						equal(valueAt(plain, path), input.values[i])
						equal(valueAt(checked, path), input.values[i])
					}

					equal(errors, input === high ? box.paths.length : 0)

					// The writers take the number fields with no BigInt.
					if (input !== high) {
						deepStrictEqual(writeIsoBox(plain, defaultWriterConfig()), input.bytes)
					} else {
						equal(writeIsoBox(plain, defaultWriterConfig()).length, input.bytes.length)
					}
				}
			}

			// readInt64AsBigInt needs BigInt and does not test for it. The read fails with the error of the runtime.
			throws(
				() => readIsoBoxes(tfdtV0, defaultReaderConfig({ int64: readInt64AsBigInt })),
				ReferenceError,
			)
		} finally {
			globalThis.BigInt = NativeBigInt
		}
	})
})
