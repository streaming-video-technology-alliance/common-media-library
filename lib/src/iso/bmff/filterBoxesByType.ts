import type { Box } from './boxes/Box.js';
import type { IsoBmffBox } from './boxes/IsoBmffBox.js';
import { filterBoxes } from './filterBoxes.js';
import type { IsoData } from './IsoData.js';
import type { IsoViewConfig } from './IsoViewConfig.js';

/**
 * Filter boxes by type from an IsoView
 *
 * @param type - The type(s) of boxes to filter
 * @param raw - The raw ISO data
 * @param config - The configuration for the IsoView
 *
 * @returns The filtered boxes
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function filterBoxesByType<T extends Box = IsoBmffBox>(raw: IsoData, type: string | string[], config: IsoViewConfig = {}): T[] {
	if (!Array.isArray(type)) {
		type = [type];
	}

	return filterBoxes(raw, box => type.includes(box.type), config);
}
