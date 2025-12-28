import type { ContainerBox } from './boxes/ContainerBox.ts'
import type { IsoBox } from './boxes/IsoBox.ts'
import type { IsoBoxData } from './IsoBoxData.ts'
import type { IsoBoxFilter } from './IsoBoxFilter.ts'
import { IsoBoxReadView } from './IsoBoxReadView.ts'
import type { IsoBoxReadViewConfig } from './IsoBoxReadViewConfig.ts'

function filter<T extends IsoBox = IsoBox>(iterator: Iterable<IsoBox>, fn: IsoBoxFilter<T>, recursive: boolean, result: T[]): T[] {
	for (const box of iterator) {
		if (fn(box)) {
			result.push(box as T)
		}

		const { boxes } = box as ContainerBox<IsoBox>
		if (recursive && Array.isArray(boxes)) {
			filter(boxes, fn, recursive, result)
		}
	}

	return result
}

/**
 * Filters boxes based on the given filter function.
 *
 * @param raw - The raw boxes to filter.
 * @param config - The box parser configuration.
 * @param fn - The filter function.
 * @returns The filtered boxes.
 *
 * @public
 */
export function filterIsoBoxes<T extends IsoBox = IsoBox>(raw: IsoBoxData | Iterable<IsoBox>, fn: IsoBoxFilter<T>, config?: IsoBoxReadViewConfig): T[] {
	if (raw instanceof DataView || raw instanceof Uint8Array || raw instanceof ArrayBuffer) {
		raw = new IsoBoxReadView(raw, { ...config, recursive: false })
	}

	const recursive = config?.recursive ?? true
	return filter<T>(raw, fn, recursive, [])
}
