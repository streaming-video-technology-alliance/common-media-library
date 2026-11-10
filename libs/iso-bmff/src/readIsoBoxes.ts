import type { Box } from './boxes/Box.ts'
import type { IsoBoxContainer } from './IsoBoxContainer.ts'
import type { IsoBoxData } from './IsoBoxData.ts'
import type { IsoBoxReaderMap } from './IsoBoxReaderMap.ts'
import type { IsoBoxReaderReturn } from './IsoBoxReaderReturn.ts'
import { IsoBoxReadView } from './IsoBoxReadView.ts'
import type { IsoBoxReadViewConfig } from './IsoBoxReadViewConfig.ts'
import type { ParsedBox } from './ParsedBox.ts'
import type { ParsedIsoBox } from './ParsedIsoBox.ts'

/**
 * Reads ISO boxes from a data source.
 *
 * The result type follows the reader map. `box.type === 'xxxx'` narrows to the
 * return type of the reader under that key. A box without a reader keeps its
 * header only, and a container box also has its child boxes. See
 * `IsoBoxReaderReturn` for the two cases of the result type.
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
export function readIsoBoxes<const R extends IsoBoxReaderMap>(
	raw: IsoBoxData,
	config: IsoBoxReadViewConfig & { readers: R },
): IsoBoxReaderReturn<R>[]

/**
 * Reads ISO boxes from a data source without a reader map. Every box keeps its
 * header only, and a container box also has its child boxes.
 *
 * @param raw - The raw ISO data
 *
 * @returns The parsed boxes
 *
 * @public
 */
export function readIsoBoxes(raw: IsoBoxData): ParsedBox<IsoBoxContainer | Box>[]

/**
 * Reads ISO boxes from a data source with a configuration whose reader map is
 * not known at compile time. The result may contain any built-in box type.
 *
 * @param raw - The raw ISO data
 * @param config - The configuration for the IsoView
 *
 * @returns The parsed boxes
 *
 * @public
 */
export function readIsoBoxes(raw: IsoBoxData, config?: IsoBoxReadViewConfig): ParsedIsoBox[]
export function readIsoBoxes(raw: IsoBoxData, config?: IsoBoxReadViewConfig): ParsedIsoBox[] {
	const boxes = []

	for (const box of new IsoBoxReadView(raw, config)) {
		boxes.push(box)
	}

	return boxes
}
