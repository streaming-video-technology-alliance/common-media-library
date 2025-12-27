import type { ContainerBox } from './boxes/types/ContainerBox.ts'
import type { IsoBmffBox } from './boxes/types/IsoBmffBox.ts'
import type { IsoBoxData } from './IsoBoxData.ts'
import type { IsoBoxFilter } from './IsoBoxFilter.ts'
import { IsoBoxReadView } from './IsoBoxReadView.ts'
import type { IsoBoxReadViewConfig } from './IsoBoxReadViewConfig.ts'

function find<T extends IsoBmffBox = IsoBmffBox>(iterator: Iterable<IsoBmffBox>, recursive: boolean, fn: IsoBoxFilter<T>): T | null {
	for (const box of iterator) {
		if (fn(box)) {
			return box as T
		}

		const { boxes } = box as ContainerBox<IsoBmffBox>
		if (recursive && Array.isArray(boxes)) {
			const result = find(boxes, recursive, fn)

			if (result) {
				return result as T
			}
		}
	}

	return null
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
 * @public
 */
export function findIsoBox<T extends IsoBmffBox = IsoBmffBox>(
	raw: IsoBoxData | Iterable<IsoBmffBox>,
	fn: IsoBoxFilter<T>,
	config?: IsoBoxReadViewConfig
): T | null {
	const recursive = config?.recursive ?? true
	if (raw instanceof DataView || raw instanceof Uint8Array || raw instanceof ArrayBuffer) {
		raw = new IsoBoxReadView(raw, { ...config, recursive: false })
	}

	return find(raw, recursive, fn)
}
