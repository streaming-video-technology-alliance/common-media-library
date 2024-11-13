import type { Box } from './Box.js';
import type { BoxFilter } from './BoxFilter.js';
import type { BoxParserConfig } from './BoxParserConfig.js';
import { createBoxIterator } from './createBoxIterator.js';
import type { RawBoxes } from './RawBoxes.js';

export function findBox<T = any>(raw: RawBoxes, config: BoxParserConfig, fn: BoxFilter): Box<T> | null {
	for (const box of createBoxIterator(raw, config)) {
		if (fn(box)) {
			return box;
		}
	}

	return null;
}
