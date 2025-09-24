import type { IsoBmffBox } from './boxes/IsoBmffBox.js';
import type { IsoBmffBoxMap } from './boxes/IsoBmffBoxMap.js';
import { findBox } from './findBox.js';
import type { IsoData } from './IsoData.js';
import type { IsoViewConfig } from './IsoViewConfig.js';

/**
 * Find a box from an IsoView that matches a given type
 *
 * @param type - The type of box to find
 * @param raw - The raw ISO data
 * @param config - The configuration for the IsoView
 *
 * @returns The first box that matches the type
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function findBoxByType<T extends keyof IsoBmffBoxMap>(raw: IsoData, type: T, config: IsoViewConfig = {}): IsoBmffBoxMap[T] | null {
	return findBox(raw, (box: IsoBmffBox): box is IsoBmffBoxMap[T] => box.type === type, config);
}
