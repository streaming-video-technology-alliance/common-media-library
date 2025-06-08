import type { AnyBox } from './boxes/AnyBox.js';
import type { Box } from './boxes/Box.js';
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
export function findBoxByType<T extends Box = AnyBox>(raw: IsoData, type: string, config: IsoViewConfig = {}): T | null {
	return findBox<T>(raw, box => box.type === type, config);
}

const box = findBoxByType(new ArrayBuffer(100), 'ftyp', { recursive: true });

console.log(box);
