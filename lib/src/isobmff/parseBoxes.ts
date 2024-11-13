import type { Box } from './Box.js';
import type { BoxParserConfig } from './BoxParserConfig.js';
import { ContainerBoxes } from './ContainerBoxes.js';
import { createCursorView } from './createCursorView.js';
import { STRING } from './fields/STRING.js';
import { UINT } from './fields/UINT.js';
import type { RawBoxes } from './RawBoxes.js';

export function parseBoxes(raw: RawBoxes, config: BoxParserConfig): Box[] {
	const { parsers = {} } = config;
	const cursorView = createCursorView(raw);
	const boxes = [];

	while (!cursorView.done) {
		const size = cursorView.read(UINT, 4);
		const type = cursorView.read(STRING, 4);
		const bodyView = cursorView.slice(size - 8);
		const parser = parsers[type];
		const value = parser ? parser(bodyView, parsers) : ContainerBoxes.includes(type) ? parseBoxes(bodyView, config) : bodyView;

		boxes.push({
			type,
			size,
			value,
		});
	}

	return boxes;
}
