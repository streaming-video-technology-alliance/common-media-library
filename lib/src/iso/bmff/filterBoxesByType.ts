import type { Box } from './Box.js';
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
export function filterBoxesByType(raw: IsoData, type: string | string[], config: IsoViewConfig = {}): Box[] {
	if (!Array.isArray(type)) {
		type = [type];
	}

	return filterBoxes(raw, box => type.includes(box.type), config);
}
