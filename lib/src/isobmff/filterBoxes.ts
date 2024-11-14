import type { Box } from './Box.js';
import type { BoxFilter } from './BoxFilter.js';
import { createIsoView } from './createIsoView.js';
import type { IsoData } from './IsoData.js';
import type { IsoViewConfig } from './IsoViewConfig.js';

function filter<T = any>(raw: IsoData, config: IsoViewConfig, fn: BoxFilter, boxes: Box<T>[] = []): Box<T>[] {
	for (const box of createIsoView(raw, config)) {
		if (fn(box)) {
			boxes.push(box);
		}

		if (box.value?.boxes) {
			filter<T>(box.value, config, fn, boxes);
		}
	}

	return boxes;
}

/**
 * Filters boxes based on the given filter function.
 *
 * @param raw - The raw boxes to filter.
 * @param config - The box parser configuration.
 * @param fn - The filter function.
 * @returns The filtered boxes.
 *
 * @group ISOBMFF
 * @beta
 */
export function filterBoxes<T = any>(raw: IsoData, config: IsoViewConfig, fn: BoxFilter): Box<T>[] {
	return filter(raw, config, fn);
}
