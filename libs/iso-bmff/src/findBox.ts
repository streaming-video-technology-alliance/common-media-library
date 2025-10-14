import type { ContainerBox } from './boxes/ContainerBox.ts';
import type { IsoBmffBox } from './boxes/IsoBmffBox.ts';
import type { BoxFilter } from './BoxFilter.ts';
import { createIsoView } from './createIsoView.ts';
import type { IsoData } from './IsoData.ts';
import type { IsoViewConfig } from './IsoViewConfig.ts';

function find<T extends IsoBmffBox = IsoBmffBox>(iterator: Iterable<IsoBmffBox>, recursive: boolean, fn: BoxFilter<T>): T | null {
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
 *
 * @beta
 */
export function findBox<T extends IsoBmffBox = IsoBmffBox>(raw: IsoData | Iterable<IsoBmffBox>, fn: BoxFilter<T>, config?: IsoViewConfig): T | null {
	const recursive = config?.recursive ?? true;
	if (raw instanceof DataView || raw instanceof Uint8Array || raw instanceof ArrayBuffer) {
		raw = createIsoView(raw, { ...config, recursive: false });
	}

	return find(raw, recursive, fn);
}
