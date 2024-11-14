import type { Box } from './Box.js';
import { ContainerBoxes } from './ContainerBoxes.js';
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
export function parseBoxes(raw: IsoData, config: IsoViewConfig): Box[] {
	const { parsers = {} } = config;
	const isoView = createIsoView(raw, config);
	const boxes = [];

	while (!isoView.done) {
		const { size, type, value: bodyView } = isoView.readBox();
		const parser = parsers[type];
		const value = parser ? parser(bodyView, config) : ContainerBoxes.includes(type) ? parseBoxes(bodyView, config) : bodyView;

		boxes.push({
			type,
			size,
			value,
		});
	}

	return boxes;
}
