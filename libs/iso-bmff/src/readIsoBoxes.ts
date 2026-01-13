import type { IsoBoxData } from './IsoBoxData.ts'
import type { IsoBoxReaderMap } from './IsoBoxReaderMap.ts'
import type { IsoBoxReaderReturn } from './IsoBoxReaderReturn.ts'
import { IsoBoxReadView } from './IsoBoxReadView.ts'
import type { IsoBoxReadViewConfig } from './IsoBoxReadViewConfig.ts'
import type { ParsedIsoBox } from './ParsedIsoBox.ts'

/**
 * Reads ISO boxes from a data source.
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
export function readIsoBoxes<const R extends IsoBoxReaderMap>(raw: IsoBoxData, config: IsoBoxReadViewConfig & { readers: R }): IsoBoxReaderReturn<R>[];

/**
 * @public
 */
export function readIsoBoxes(raw: IsoBoxData, config?: IsoBoxReadViewConfig): ParsedIsoBox[];
export function readIsoBoxes(raw: IsoBoxData, config?: IsoBoxReadViewConfig): ParsedIsoBox[] {
	const boxes = []

	for (const box of new IsoBoxReadView(raw, config)) {
		boxes.push(box)
	}

	return boxes
}
