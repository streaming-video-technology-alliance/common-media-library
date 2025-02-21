import type { Box } from './Box.js';
import { createIsoView } from './createIsoView.js';
import type { IsoData } from './IsoData.js';
import type { IsoViewConfig } from './IsoViewConfig.js';

/**
 * Parse boxes from an IsoView
 *
 * @param raw - The raw ISO data
 * @param config - The configuration for the IsoView
 *
 * @returns The parsed boxes
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function parseBoxes(raw: IsoData, config?: IsoViewConfig): Box[] {
	const boxes = [];

	for (const box of createIsoView(raw, config)) {
		boxes.push(box);
	}

	return boxes;
}
