import type { Box } from './Box';
import type { BoxFilter } from './BoxFilter';
import { createIsoView } from './createIsoView.ts';
import type { IsoData } from './IsoData';
import type { IsoViewConfig } from './IsoViewConfig';

function find(iterator: Iterable<Box>, recursive: boolean, fn: BoxFilter): Box | null {
	for (const box of iterator) {
		if (fn(box)) {
			return box;
		}

		if (recursive && Array.isArray(box.boxes)) {
			const result = find(box.boxes, recursive, fn);

			if (result) {
				return result;
			}
		}
	}

	return null;
}

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
export function findBox(raw: IsoData, config: IsoViewConfig, fn: BoxFilter): Box | null {
	return find(createIsoView(raw, { ...config, recursive: false }), !!config.recursive, fn);
}
