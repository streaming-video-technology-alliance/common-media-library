import type { Box } from './Box.js';
import type { BoxFilter } from './BoxFilter.js';
import { createIsoView } from './createIsoView.js';
import type { IsoData } from './IsoData.js';
import type { IsoViewConfig } from './IsoViewConfig.js';

function filter(iterator: Iterable<Box>, fn: BoxFilter, recursive: boolean, boxes: Box[]): Box[] {
	for (const box of iterator) {
		if (fn(box)) {
			boxes.push(box);
		}

		if (recursive && Array.isArray(box.boxes)) {
			filter(box.boxes, fn, recursive, boxes);
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
export function filterBoxes(raw: IsoData | Iterable<Box>, fn: BoxFilter, config?: IsoViewConfig): Box[] {
	if (raw instanceof DataView || raw instanceof Uint8Array || raw instanceof ArrayBuffer) {
		raw = createIsoView(raw, config);
	}

	const recursive = config?.recursive ?? true;
	return filter(raw, fn, recursive, []);
}
