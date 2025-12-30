import type { IsoBoxReaderMap } from './IsoBoxReaderMap.ts'

/**
 * ISO Box Read View configuration
 *
 * @public
 */
export type IsoBoxReadViewConfig<R extends IsoBoxReaderMap = IsoBoxReaderMap> = {
	/**
	 * A map of box parsers to their box types
	 */
	readers?: R
}
