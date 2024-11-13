import type { Box } from './Box.js';
import type { BoxParserConfig } from './BoxParserConfig.js';
import type { CursorView } from './CursorView.js';
import { filterBoxes } from './filterBoxes.js';

export function filterBoxesByType<T = any>(type: string, raw: ArrayBuffer | DataView | CursorView, config: BoxParserConfig): Box<T>[] {
	return filterBoxes(raw, config, box => box.type === type);
}
