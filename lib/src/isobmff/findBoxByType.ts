import type { Box } from './Box.js';
import type { BoxParserConfig } from './BoxParserConfig.js';
import { findBox } from './findBox.js';
import type { RawBoxes } from './RawBoxes.js';

export function findBoxByType<T = any>(type: string, raw: RawBoxes, config: BoxParserConfig): Box<T> | null {
	return findBox(raw, config, box => box.type === type);
}
