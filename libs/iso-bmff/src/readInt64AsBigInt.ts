import type { IsoBoxReadView } from './IsoBoxReadView.ts'
import type { IsoInt64 } from './IsoInt64.ts'

/**
 * Reads an integer field of 4 or 8 bytes as a `bigint`.
 *
 * Pass this function as the `int64` option of `IsoBoxReadConfig`.
 * The built-in readers then return every 64-bit integer field as a `bigint`, with the exact value.
 * A field that is 32 bits in version 0 of its box is a `bigint` too.
 *
 * This function needs `BigInt` and the `getBigUint64` method of `DataView`, and does not test for them.
 * On a runtime without them, a read fails with the error of the runtime.
 * If your code supports such a runtime, test `typeof DataView.prototype.getBigUint64 === 'function'` before you pass this function.
 * The test is `false` on a runtime without `BigInt` too.
 *
 * @param view - The view to read the field from.
 * @param size - The size of the field in bytes.
 * @param signed - Whether the field is a signed integer.
 * @returns The value of the field.
 *
 * @example
 * {@includeCode ../test/readInt64AsBigInt.test.ts#example}
 *
 * @public
 */
export function readInt64AsBigInt(
	view: IsoBoxReadView<IsoInt64>,
	size: 4 | 8,
	signed: boolean,
): bigint {
	if (size === 8) {
		const value = view.readUint64()
		return signed ? BigInt.asIntN(64, value) : value
	}

	return BigInt(signed ? view.readInt(size) : view.readUint(size))
}
