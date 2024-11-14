import type { Box } from './Box.js';
import { findBox } from './findBox.js';
import type { IsoData } from './IsoData.js';
import type { IsoViewConfig } from './IsoViewConfig.js';

export function findBoxByType<T = any>(type: string, raw: IsoData, config: IsoViewConfig): Box<T> | null {
	return findBox(raw, config, box => box.type === type);
}
