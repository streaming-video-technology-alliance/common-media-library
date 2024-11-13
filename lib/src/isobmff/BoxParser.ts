import type { Box } from './Box.js';
import type { BoxParserMap } from './BoxParserMap.js';
import type { CursorView } from './CursorView.js';

export type BoxParser<V = any> = (view: CursorView, parsers?: BoxParserMap) => Box<V>;
