import type { Box } from './Box.js';
import type { BoxFilter } from './BoxFilter.js';
import { createIsoView } from './createIsoView.js';
import type { IsoData } from './IsoData.js';
import type { IsoViewConfig } from './IsoViewConfig.js';

function filter(iterator: Iterable<Box>, recursive: boolean, fn: BoxFilter, boxes: Box[] = []): Box[] {
	for (const box of iterator) {
		if (fn(box)) {
			boxes.push(box);
		}

		if (recursive && Array.isArray(box.boxes)) {
			filter(box.boxes, recursive, fn, boxes);
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
export function filterBoxes(raw: IsoData, config: IsoViewConfig, fn: BoxFilter): Box[] {
	return filter(createIsoView(raw, { ...config, recursive: false }), !!config.recursive, fn);
}
