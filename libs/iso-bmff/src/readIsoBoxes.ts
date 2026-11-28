import type { IsoBoxData } from './IsoBoxData.ts'
import { createIsoBoxReadCursor } from './createIsoBoxReadCursor.ts'
import { readChildBoxes } from './readChildBoxes.ts'
import type { IsoBoxReadConfig } from './IsoBoxReadConfig.ts'
import type { IsoInt64 } from './IsoInt64.ts'
import type { ParsedIsoBoxList } from './ParsedIsoBox.ts'

/**
 * Reads ISO boxes from a data source.
 *
 * The `int64` option of the configuration selects the type of every 64-bit integer field.
 * With `readInt64AsBigInt`, the built-in readers return those fields as a `bigint`.
 *
 * A box with a reader in the configuration is a box object. A box with no reader and a type in `CONTAINERS` has its child boxes in `boxes`.
 * Any other box with no reader is a raw box: `{ type, bytes, headerSize }`.
 *
 * The result type does not follow the readers map. Every box has the type `ParsedIsoBox`, and `type` has the four-character code.
 * Use `isIsoBoxType` to narrow a box to a box type. A test such as `box.type === 'tfdt'` also matches a raw box, and does not narrow.
 *
 * The function stops before a box if the data ends inside the header or the body of that box.
 * The function also stops before a box with a size below the size of its header.
 * The function then returns the boxes before that box and does not throw for that box.
 *
 * With the `spans` option, every box of the result has the `start` and `end` fields of `IsoBoxSpan`.
 * The result type has the fields when the option is the literal `true`.
 * The child boxes of a container have the fields too. Their type is `ParsedIsoBox<V>`, so narrow a child with `hasIsoBoxSpan` to read them.
 *
 * @param raw - The raw ISO data
 * @param config - The readers map, the `int64` option, and the `spans` option.
 *
 * @returns The parsed boxes
 *
 * @throws RangeError if a reader throws a `RangeError`, such as for a box that is too short for its fields. The error has the `box` field of `IsoBoxReadError` with the box type and the position of the box. The function does not catch an error of another class.
 * @throws RangeError if a box is deeper than 128 levels.
 *
 * @example
 * {@includeCode ../test/readIsoBoxes.test.ts#example}
 *
 * @example
 * {@includeCode ../test/readIsoBoxes.test.ts#spans}
 *
 * @public
 */
export function readIsoBoxes<V extends IsoInt64 = number, S extends boolean = boolean>(
	raw: IsoBoxData,
	config?: IsoBoxReadConfig<V, S>,
): ParsedIsoBoxList<V, S> {
	return readChildBoxes(createIsoBoxReadCursor(raw, config))
}
