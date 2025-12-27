import type { IsoBmffBox } from './boxes/types/IsoBmffBox.ts'
import type { IsoBmffBoxMap } from './boxes/types/IsoBmffBoxMap.ts'
import { findIsoBox } from './findIsoBox.ts'
import type { IsoBoxData } from './IsoBoxData.ts'
import type { IsoBoxReadViewConfig } from './IsoBoxReadViewConfig.ts'

/**
 * Find a box from an IsoView that matches a given type
 *
 * @param type - The type of box to find
 * @param raw - The raw ISO data
 * @param config - The configuration for the IsoView
 *
 * @returns The first box that matches the type
 *
 * @public
 */
export function findIsoBoxByType<T extends keyof IsoBmffBoxMap>(
	raw: IsoBoxData,
	type: T,
	config: IsoBoxReadViewConfig = {}
): IsoBmffBoxMap[T] | null {
	return findIsoBox(raw, (box: IsoBmffBox): box is IsoBmffBoxMap[T] => box.type === type, config)
}
