import type { IsoInt64Reader } from './IsoInt64Reader.ts'

/**
 * Creates a function for the `int64` option of `IsoBoxReadViewConfig` that reports a rounded value.
 *
 * The function reads every 64-bit integer field as a `number`, so the types of the result do not change.
 * A `number` holds integers up to 2^53 - 1 exactly.
 * When a value is outside the safe integer range, the function calls `onOverflow` with a `RangeError`.
 * When `onOverflow` returns, the read continues with the rounded value.
 * When `onOverflow` throws, the read stops with that error.
 *
 * The function does not need `BigInt`. To read the exact value, use `readInt64AsBigInt`.
 *
 * @param onOverflow - The callback for a value outside the safe integer range.
 * @returns A function for the `int64` option.
 *
 * @example
 * {@includeCode ../test/createInt64OverflowReader.test.ts#example}
 *
 * @public
 */
export function createInt64OverflowReader(onOverflow: (error: RangeError) => void): IsoInt64Reader {
	return (view, size, signed) => {
		const value = signed ? view.readInt(size) : view.readUint(size)

		if (!Number.isSafeInteger(value)) {
			onOverflow(new RangeError('64-bit value is outside the safe integer range'))
		}

		return value
	}
}
