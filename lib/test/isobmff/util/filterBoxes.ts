import { filterBoxesByType, type Box, type BoxParser } from '@svta/common-media-library';
import { createParsers } from './createParsers';
import { load } from './load';

export function filterBoxes<T>(file: string, boxParsers: BoxParser<T> | BoxParser<T>[]): Box<T>[] {
	const { name, parsers } = createParsers(boxParsers);
	return filterBoxesByType(name, load(file), { parsers, recursive: true });
}