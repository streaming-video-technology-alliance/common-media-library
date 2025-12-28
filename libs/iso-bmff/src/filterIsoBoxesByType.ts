import type { IsoBox } from './boxes/IsoBox.ts'
import type { IsoBoxMap } from './boxes/IsoBoxMap.ts'
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
export function filterIsoBoxesByType<T extends keyof IsoBoxMap>(
	raw: IsoBoxData, type: T | T[],
	config: IsoBoxReadViewConfig = {}
): IsoBoxMap[T][] {
	if (!Array.isArray(type)) {
		type = [type]
	}

	return filterIsoBoxes(raw, (box: IsoBox): box is IsoBoxMap[T] => type.includes(box.type as T), config)
}
