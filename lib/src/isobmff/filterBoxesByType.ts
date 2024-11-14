import type { Box } from './Box.js';
import { filterBoxes } from './filterBoxes.js';
import type { IsoData } from './IsoData.js';
import type { IsoViewConfig } from './IsoViewConfig.js';

export function filterBoxesByType<T = any>(type: string, raw: IsoData, config: IsoViewConfig): Box<T>[] {
	return filterBoxes(raw, config, box => box.type === type);
}
