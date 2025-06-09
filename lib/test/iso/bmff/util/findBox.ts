import { findBoxByType, type AnyBox, type BoxParser } from '@svta/common-media-library';
import assert from 'node:assert';
import { createParsers } from './createParsers.ts';
import { load } from './load.ts';

export function findBox<T = AnyBox>(file: string, boxParsers: BoxParser<T> | BoxParser<T>[]): T {
	const { name, parsers } = createParsers(boxParsers);
	const box = findBoxByType(load(file), name, { parsers, recursive: true });

	assert.ok(box);

	return box as T;
}
