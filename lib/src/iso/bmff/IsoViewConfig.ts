import type { BoxParserMap } from './BoxParserMap.ts';

/**
 * ISO View configuration
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type IsoViewConfig = {
	/**
	 * A map of box parsers to their box types
	 */
	parsers?: BoxParserMap;

	/**
	 * Whether to parse boxes recursively
	 */
	recursive?: boolean;
};
