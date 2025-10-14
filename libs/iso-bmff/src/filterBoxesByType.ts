import type { IsoBmffBox } from './boxes/IsoBmffBox.ts';
import type { IsoBmffBoxMap } from './boxes/IsoBmffBoxMap.ts';
import { filterBoxes } from './filterBoxes.ts';
import type { IsoData } from './IsoData.ts';
import type { IsoViewConfig } from './IsoViewConfig.ts';

/**
 * Filter boxes by type from an IsoView
 *
 * @param type - The type(s) of boxes to filter
 * @param raw - The raw ISO data
 * @param config - The configuration for the IsoView
 *
 * @returns The filtered boxes
 *
 *
 * @beta
 */
export function filterBoxesByType<T extends keyof IsoBmffBoxMap>(raw: IsoData, type: T | T[], config: IsoViewConfig = {}): IsoBmffBoxMap[T][] {
	if (!Array.isArray(type)) {
		type = [type];
	}

	return filterBoxes(raw, (box: IsoBmffBox): box is IsoBmffBoxMap[T] => type.includes(box.type as T), config);
}
