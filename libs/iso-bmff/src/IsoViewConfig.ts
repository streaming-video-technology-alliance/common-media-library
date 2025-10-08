import type { BoxParserMap } from './BoxParserMap.js';

/**
 * ISO View configuration
 *
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
