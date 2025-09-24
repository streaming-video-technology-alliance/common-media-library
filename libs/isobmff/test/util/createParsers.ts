import type { IsoBmffBoxMap } from '@svta/common-media-library';
import type { BoxParser, BoxParserMap } from './box';

export function createParsers(parsers: BoxParser | BoxParser[]): { name: keyof IsoBmffBoxMap, parsers: BoxParserMap } {
	if (!Array.isArray(parsers)) {
		parsers = [parsers];
	}

	return {
		name: parsers[0].name as keyof IsoBmffBoxMap,
		parsers: parsers.reduce((acc, parser) => {
			acc[parser.name] = parser;
			return acc;
		}, {} as BoxParserMap),
	};
}
