import type { IsoBoxData } from './IsoBoxData.ts'
import type { IsoBoxReaderMap } from './IsoBoxReaderMap.ts'
import type { IsoBoxReaderReturn } from './IsoBoxReaderReturn.ts'
import { IsoBoxReadView } from './IsoBoxReadView.ts'
import type { IsoBoxReadConfig } from './IsoBoxReadConfig.ts'
import type { IsoInt64 } from './IsoInt64.ts'
import type { ParsedIsoBox } from './ParsedIsoBox.ts'

/**
 * Reads ISO boxes from a data source.
 *
 * The `int64` option of the configuration selects the type of every 64-bit integer field.
 * With `readInt64AsBigInt`, the built-in readers return those fields as a `bigint`.
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
 * @throws RangeError if a box is complete and a reader reads past the end of that box.
 *
 * @example
 * {@includeCode ../test/readIsoBoxes.test.ts#example}
 *
 * @public
 */
export function readIsoBoxes<const R extends IsoBoxReaderMap<V>, V extends IsoInt64 = number>(
	raw: IsoBoxData,
	config: IsoBoxReadConfig<V> & { readers: R },
): IsoBoxReaderReturn<R, V>[]

/**
 * Reads ISO boxes from a data source with no readers map in the type of the configuration.
 *
 * @param raw - The raw ISO data
 * @param config - The readers map and the `int64` option. The configuration is required when `V` is `bigint`.
 *
 * @returns The parsed boxes
 *
 * @throws RangeError if a box is complete and a reader reads past the end of that box.
 *
 * @public
 */
export function readIsoBoxes<V extends IsoInt64 = number>(
	raw: IsoBoxData,
	...config: [V] extends [bigint] ? [config: IsoBoxReadConfig<V>] : [config?: IsoBoxReadConfig<V>]
): ParsedIsoBox<V>[]

/**
 * Reads ISO boxes from a data source with `number` fields.
 *
 * `Parameters<typeof readIsoBoxes>` and `ReturnType<typeof readIsoBoxes>` resolve to this signature.
 *
 * @param raw - The raw ISO data
 * @param config - The readers map and the `int64` option.
 *
 * @returns The parsed boxes
 *
 * @throws RangeError if a box is complete and a reader reads past the end of that box.
 *
 * @public
 */
export function readIsoBoxes(raw: IsoBoxData, config?: IsoBoxReadConfig): ParsedIsoBox[]
export function readIsoBoxes(raw: IsoBoxData, config?: IsoBoxReadConfig): ParsedIsoBox[] {
	return new IsoBoxReadView(raw, config).readBoxes<ParsedIsoBox>()
}
