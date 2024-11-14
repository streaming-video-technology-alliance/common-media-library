import type { Box } from './Box.js';
import type { BoxFilter } from './BoxFilter.js';
import { createIsoView } from './createIsoView.js';
import type { IsoData } from './IsoData.js';
import type { IsoViewConfig } from './IsoViewConfig.js';

export function findBox<T = any>(raw: IsoData, config: IsoViewConfig, fn: BoxFilter): Box<T> | null {
	for (const box of createIsoView(raw, config)) {
		if (fn(box)) {
			return box;
		}
	}

	return null;
}
