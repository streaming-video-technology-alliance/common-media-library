// @ts-ignore
import { Parser } from 'm3u8-parser';

export function parseM3u8(text: string) {
	const parser = new Parser();

	parser.push(text);
	parser.end();
	const parsedM3u8 = parser.manifest;
	if (!parsedM3u8) {
		throw new Error();
	}

	return parsedM3u8;
}

