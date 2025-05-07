import type { BoxParser } from './BoxParser.ts';

/**
 * A map of box parsers to their box types
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type BoxParserMap = Record<string, BoxParser>;
