import type { Box } from './Box.ts';
import { createIsoView } from './createIsoView.ts';
import type { IsoData } from './IsoData.ts';
import type { IsoViewConfig } from './IsoViewConfig.ts';

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
