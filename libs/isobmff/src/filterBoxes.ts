import type { ContainerBox } from './boxes/ContainerBox.js';
import type { IsoBmffBox } from './boxes/IsoBmffBox.js';
import type { BoxFilter } from './BoxFilter.js';
import { createIsoView } from './createIsoView.js';
import type { IsoData } from './IsoData.js';
import type { IsoViewConfig } from './IsoViewConfig.js';

function filter<T extends IsoBmffBox = IsoBmffBox>(iterator: Iterable<IsoBmffBox>, fn: BoxFilter<T>, recursive: boolean, result: T[]): T[] {
	for (const box of iterator) {
		if (fn(box)) {
			result.push(box as T);
		}

		const { boxes } = box as ContainerBox<IsoBmffBox>;
		if (recursive && Array.isArray(boxes)) {
			filter(boxes, fn, recursive, result);
		}
	}

	return result;
}

/**
 * Filters boxes based on the given filter function.
 *
 * @param raw - The raw boxes to filter.
 * @param config - The box parser configuration.
 * @param fn - The filter function.
 * @returns The filtered boxes.
 *
 * @beta
 */
export function filterBoxes<T extends IsoBmffBox = IsoBmffBox>(raw: IsoData | Iterable<IsoBmffBox>, fn: BoxFilter<T>, config?: IsoViewConfig): T[] {
	if (raw instanceof DataView || raw instanceof Uint8Array || raw instanceof ArrayBuffer) {
		raw = createIsoView(raw, { ...config, recursive: false });
	}

	const recursive = config?.recursive ?? true;
	return filter<T>(raw, fn, recursive, []);
}
