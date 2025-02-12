import type { Box, BoxParser } from '@svta/common-media-library';
import { parseFile } from './parseFile';

export function parseBox<T>(file: string, parser: BoxParser<T>, index: number): Box<T> {
	return parseFile(file, { parsers: { [parser.name]: parser } })[index];
}
