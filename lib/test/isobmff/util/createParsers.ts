import type { BoxParser, BoxParserMap } from './box';

export function createParsers(parsers: BoxParser | BoxParser[]): { name: string, parsers: BoxParserMap } {
	if (!Array.isArray(parsers)) {
		parsers = [parsers];
	}

	return {
		name: parsers[0].name,
		parsers: parsers.reduce((acc, parser) => {
			acc[parser.name] = parser;
			return acc;
		}, {} as BoxParserMap),
	};
}
