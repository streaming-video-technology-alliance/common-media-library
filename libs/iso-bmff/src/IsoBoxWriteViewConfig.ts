import type { IsoBoxWriterMap } from './IsoBoxWriterMap.ts'

/**
 * Configuration for `writeIsoBox`, `writeIsoBoxes`, and `createIsoBoxReadableStream`.
 *
 * @public
 */
export type IsoBoxWriteViewConfig = {
	/**
	 * A map of box writers to their box types. With no map, a write takes only containers, byte arrays, and boxes with a `view`.
	 */
	writers?: IsoBoxWriterMap
}
