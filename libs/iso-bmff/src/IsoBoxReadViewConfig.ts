import type { IsoBoxReaderMap } from './IsoBoxReaderMap.ts'

/**
 * ISO Box Read View configuration
 *
 * @public
 */
export type IsoBoxReadViewConfig = {
	/**
	 * A map of box parsers to their box types
	 */
	readers?: IsoBoxReaderMap
}
