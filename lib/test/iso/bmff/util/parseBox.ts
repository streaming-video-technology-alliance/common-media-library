import type { Box, BoxParser } from '@svta/common-media-library';
import { parseFile } from './parseFile.ts';

export function parseBox<T>(file: string, parser: BoxParser<T>, index: number): Box {
	return parseFile(file, { parsers: { [parser.name]: parser } })[index];
}
