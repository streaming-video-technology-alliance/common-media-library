import type { IsoBmffBox } from './boxes/IsoBmffBox.ts';
import type { IsoBmffBoxMap } from './boxes/IsoBmffBoxMap.ts';
import { findBox } from './findBox.ts';
import type { IsoData } from './IsoData.ts';
import type { IsoViewConfig } from './IsoViewConfig.ts';

/**
 * Find a box from an IsoView that matches a given type
 *
 * @param type - The type of box to find
 * @param raw - The raw ISO data
 * @param config - The configuration for the IsoView
 *
 * @returns The first box that matches the type
 *
 *
 * @beta
 */
export function findBoxByType<T extends keyof IsoBmffBoxMap>(raw: IsoData, type: T, config: IsoViewConfig = {}): IsoBmffBoxMap[T] | null {
	return findBox(raw, (box: IsoBmffBox): box is IsoBmffBoxMap[T] => box.type === type, config);
}
