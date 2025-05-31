import { findBoxByType, type Box, type BoxParser } from '@svta/common-media-library';
import assert from 'node:assert';
import { createParsers } from './createParsers.ts';
import { load } from './load.ts';

export function findBox<T>(file: string, boxParsers: BoxParser<T> | BoxParser<T>[]): Box<T> {
	const { name, parsers } = createParsers(boxParsers);
	const box = findBoxByType(name, load(file), { parsers, recursive: true });

	assert.ok(box);

	return box;
}
