import type { Box } from './boxes/Box.js';
import type { ContainerBox } from './boxes/ContainerBox.js';
import type { IsoBmffBox } from './boxes/IsoBmffBox.js';
import type { BoxFilter } from './BoxFilter.js';
import { createIsoView } from './createIsoView.js';
import type { IsoData } from './IsoData.js';
import type { IsoViewConfig } from './IsoViewConfig.js';

function find<T extends Box = IsoBmffBox>(iterator: Iterable<IsoBmffBox>, recursive: boolean, fn: BoxFilter): T | null {
	for (const box of iterator) {
		if (fn(box)) {
			return box as T;
		}

		const { boxes } = box as ContainerBox<IsoBmffBox>;
		if (recursive && Array.isArray(boxes)) {
			const result = find(boxes, recursive, fn);

			if (result) {
				return result as T;
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
export function findBox<T extends Box = IsoBmffBox>(raw: IsoData | Iterable<IsoBmffBox>, fn: BoxFilter, config?: IsoViewConfig): T | null {
	const recursive = config?.recursive ?? true;
	if (raw instanceof DataView || raw instanceof Uint8Array || raw instanceof ArrayBuffer) {
		raw = createIsoView(raw, { ...config, recursive: false });
	}

	return find(raw, recursive, fn);
}
