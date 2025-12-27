import type { IsoBmffBox } from './boxes/IsoBmffBox.ts'
import type { IsoBoxData } from './IsoBoxData.ts'
import { IsoBoxReadView } from './IsoBoxReadView.ts'
import type { IsoBoxReadViewConfig } from './IsoBoxReadViewConfig.ts'

/**
 * Reads ISO boxes from a data source.
 *
 * @param raw - The raw ISO data
 * @param config - The configuration for the IsoView
 *
 * @returns The parsed boxes
 *
 * @public
 */
export function readIsoBoxes(raw: IsoBoxData, config?: IsoBoxReadViewConfig): IsoBmffBox[] {
	const boxes = []

	for (const box of new IsoBoxReadView(raw, config)) {
		boxes.push(box)
	}

	return boxes
}
