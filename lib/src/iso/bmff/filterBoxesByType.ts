import type { Box } from './Box.ts';
import { filterBoxes } from './filterBoxes.ts';
import type { IsoData } from './IsoData.ts';
import type { IsoViewConfig } from './IsoViewConfig.ts';

/**
 * Filter boxes by type from an IsoView
 *
 * @param type - The type of boxes to filter
 * @param raw - The raw ISO data
 * @param config - The configuration for the IsoView
 *
 * @returns The filtered boxes
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function filterBoxesByType(type: string, raw: IsoData, config: IsoViewConfig = {}): Box[] {
	return filterBoxes(raw, config, box => box.type === type);
}
