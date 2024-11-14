import type { Box } from './Box.js';
import type { BoxFilter } from './BoxFilter.js';
import { createIsoView } from './createIsoView.js';
import type { IsoData } from './IsoData.js';
import type { IsoViewConfig } from './IsoViewConfig.js';

/**
 * Find a box from an IsoView that matches a filter function
 *
 * @param raw - The raw ISO data
 * @param config - The configuration for the IsoView
 * @param fn - The filter function
 *
 * @returns The first box that matches the filter function
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function findBox<T = any>(raw: IsoData, config: IsoViewConfig, fn: BoxFilter): Box<T> | null {
	for (const box of createIsoView(raw, config)) {
		if (fn(box)) {
			return box;
		}
	}

	return null;
}
