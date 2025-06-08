import { filterBoxesByType, type AnyBox, type Box, type BoxParser } from '@svta/common-media-library';
import { createParsers } from './createParsers.ts';
import { load } from './load.ts';

export function filterBoxes<T extends Box = AnyBox>(file: string, boxParsers: BoxParser<T> | BoxParser<T>[]): T[] {
	const { name, parsers } = createParsers(boxParsers);
	return filterBoxesByType<T>(load(file), name, { parsers });
}
