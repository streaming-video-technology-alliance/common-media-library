import { filterBoxesByType, type Box, type BoxParser } from '@svta/cml-iso-bmff';
import { createParsers } from './createParsers.ts';
import { load } from './load.ts';

export function filterBoxes<T extends Box = Box>(file: string, boxParsers: BoxParser<T> | BoxParser<T>[]): T[] {
	const { name, parsers } = createParsers(boxParsers);
	return filterBoxesByType(load(file), name, { parsers }) as T[];
}
