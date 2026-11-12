import type { IsoBoxData } from './IsoBoxData.ts'
import type { IsoBoxReaderMap } from './IsoBoxReaderMap.ts'
import type { IsoBoxReaderReturn } from './IsoBoxReaderReturn.ts'
import { IsoBoxReadView } from './IsoBoxReadView.ts'
import type { IsoBoxReadViewConfig } from './IsoBoxReadViewConfig.ts'
import type { IsoInt64 } from './IsoInt64.ts'
import type { ParsedIsoBox } from './ParsedIsoBox.ts'

/**
 * Reads ISO boxes from a data source.
 *
 * The `int64` option of the configuration selects the type of every 64-bit integer field.
 * With `readInt64AsBigInt`, the built-in readers return those fields as a `bigint`.
 *
 * @param raw - The raw ISO data
 * @param config - The configuration for the IsoView
 *
 * @returns The parsed boxes
 *
 * @example
 * {@includeCode ../test/readIsoBoxes.test.ts#example}
 *
 * @public
 */
export function readIsoBoxes<const R extends IsoBoxReaderMap<V>, V extends IsoInt64 = number>(
	raw: IsoBoxData,
	config: IsoBoxReadViewConfig<V> & { readers: R },
): IsoBoxReaderReturn<R, V>[]

/**
 * Reads ISO boxes from a data source with no readers map in the type of the configuration.
 *
 * @param raw - The raw ISO data
 * @param config - The configuration for the IsoView. The configuration is required when `V` is `bigint`.
 *
 * @returns The parsed boxes
 *
 * @public
 */
export function readIsoBoxes<V extends IsoInt64 = number>(
	raw: IsoBoxData,
	...config: [V] extends [bigint]
		? [config: IsoBoxReadViewConfig<V>]
		: [config?: IsoBoxReadViewConfig<V>]
): ParsedIsoBox<V>[]
export function readIsoBoxes(
	raw: IsoBoxData,
	config?: IsoBoxReadViewConfig<IsoInt64>,
): ParsedIsoBox<IsoInt64>[] {
	const boxes = []

	for (const box of new IsoBoxReadView(raw, config)) {
		boxes.push(box)
	}

	return boxes
}
