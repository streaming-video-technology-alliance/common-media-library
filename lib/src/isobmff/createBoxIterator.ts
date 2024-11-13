import type { Box } from './Box.js';
import type { BoxParserConfig } from './BoxParserConfig.js';
import { ContainerBoxes } from './ContainerBoxes.js';
import { createCursorView } from './createCursorView.js';
import { STRING } from './fields/STRING.js';
import { UINT } from './fields/UINT.js';
import type { RawBoxes } from './RawBoxes.js';

export function* createBoxIterator(raw: RawBoxes, config: BoxParserConfig): IterableIterator<Box> {
	const { parsers = {}, recursive = false } = config;
	const cursorView = createCursorView(raw);

	while (!cursorView.done) {
		const size = cursorView.read(UINT, 4);
		const type = cursorView.read(STRING, 4);
		const bodyView = cursorView.slice(size - 8);
		const parser = parsers[type];

		let value: any = bodyView;

		if (parser) {
			value = parser(bodyView, parsers);
		}
		else if (ContainerBoxes.includes(type)) {
			value = [];

			for (const box of createBoxIterator(bodyView, config)) {
				if (recursive) {
					yield box;
				}

				value.push(box);
			}
		}

		yield {
			type,
			size,
			value,
		};
	}
}
