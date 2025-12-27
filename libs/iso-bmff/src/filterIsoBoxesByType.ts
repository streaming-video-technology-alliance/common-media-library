import type { IsoBmffBox } from './boxes/types/IsoBmffBox.ts'
import type { IsoBmffBoxMap } from './boxes/types/IsoBmffBoxMap.ts'
import { filterIsoBoxes } from './filterIsoBoxes.ts'
import type { IsoBoxData } from './IsoBoxData.ts'
import type { IsoBoxReadViewConfig } from './IsoBoxReadViewConfig.ts'

/**
 * Filter boxes by type from an IsoView
 *
 * @param type - The type(s) of boxes to filter
 * @param raw - The raw ISO data
 * @param config - The configuration for the IsoView
 *
 * @returns The filtered boxes
 *
 * @public
 */
export function filterIsoBoxesByType<T extends keyof IsoBmffBoxMap>(
	raw: IsoBoxData, type: T | T[],
	config: IsoBoxReadViewConfig = {}
): IsoBmffBoxMap[T][] {
	if (!Array.isArray(type)) {
		type = [type]
	}

	return filterIsoBoxes(raw, (box: IsoBmffBox): box is IsoBmffBoxMap[T] => type.includes(box.type as T), config)
}
