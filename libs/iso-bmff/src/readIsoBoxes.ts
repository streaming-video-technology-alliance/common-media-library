import type { IsoBoxData } from './IsoBoxData.ts'
import type { IsoBoxReaderMap } from './IsoBoxReaderMap.ts'
import type { IsoBoxReaderReturn } from './IsoBoxReaderReturn.ts'
import { IsoBoxReadView } from './IsoBoxReadView.ts'
import type { IsoBoxReadViewConfig } from './IsoBoxReadViewConfig.ts'
import type { ParsedBox } from './ParsedBox.ts'

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
export function readIsoBoxes<R extends IsoBoxReaderMap>(raw: IsoBoxData, config: IsoBoxReadViewConfig<R> & { readers: R }): IsoBoxReaderReturn<R>[];
export function readIsoBoxes(raw: IsoBoxData, config?: IsoBoxReadViewConfig): ParsedBox[];
export function readIsoBoxes<R extends IsoBoxReaderMap>(raw: IsoBoxData, config?: IsoBoxReadViewConfig<R>): IsoBoxReaderReturn<R>[] | ParsedBox[] {
	const boxes = []

	for (const box of new IsoBoxReadView(raw, config)) {
		boxes.push(box)
	}

	return boxes
}
