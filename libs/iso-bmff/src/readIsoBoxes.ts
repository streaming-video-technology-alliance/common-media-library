import type { IsoBoxData } from './IsoBoxData.ts'
import { createIsoBoxReadCursor } from './createIsoBoxReadCursor.ts'
import { readChildBoxes } from './readChildBoxes.ts'
import type { IsoBoxReadConfig } from './IsoBoxReadConfig.ts'
import type { IsoInt64 } from './IsoInt64.ts'
import type { ParsedIsoBox } from './ParsedIsoBox.ts'

/**
 * Reads ISO boxes from a data source.
 *
 * The `int64` option of the configuration selects the type of every 64-bit integer field.
 * With `readInt64AsBigInt`, the built-in readers return those fields as a `bigint`.
 *
 * A box with a reader in the configuration is a box object. A box with no reader and a type in `CONTAINERS` has its child boxes in `boxes`.
 * Any other box with no reader is a raw box: `{ type, bytes, headerSize }`.
 *
 * The result type does not follow the readers map. Every box has the type `ParsedIsoBox`, also the result of a custom reader.
 * Narrow a built-in box type with `isIsoBoxType`. Narrow the result of a custom reader with a type guard for the result type of that reader.
 *
 * The function stops before a box if the data ends inside the header or the body of that box.
 * The function also stops before a box with a size below the size of its header.
 * The function then returns the boxes before that box and does not throw for that box.
 *
 * @param raw - The raw ISO data
 * @param config - The readers map and the `int64` option.
 *
 * @returns The parsed boxes
 *
 * @throws RangeError if a reader reads past the end of its box. The function does not catch an error of a reader.
 * @throws RangeError if a box is deeper than 128 levels.
 *
 * @example
 * {@includeCode ../test/readIsoBoxes.test.ts#example}
 *
 * @public
 */
export function readIsoBoxes<V extends IsoInt64 = number>(
	raw: IsoBoxData,
	config?: IsoBoxReadConfig<V>,
): ParsedIsoBox<V>[] {
	return readChildBoxes(createIsoBoxReadCursor(raw, config))
}
