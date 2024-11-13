import type { Box } from './Box.js';
import type { BoxFilter } from './BoxFilter.js';
import type { BoxParserConfig } from './BoxParserConfig.js';
import { createBoxIterator } from './createBoxIterator.js';
import type { RawBoxes } from './RawBoxes.js';

function filter<T = any>(raw: RawBoxes, config: BoxParserConfig, fn: BoxFilter, boxes: Box<T>[] = []): Box<T>[] {
	for (const box of createBoxIterator(raw, config)) {
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
export function filterBoxes<T = any>(raw: RawBoxes, config: BoxParserConfig, fn: BoxFilter): Box<T>[] {
	return filter(raw, config, fn);
}
