import type { IsoBoxWriterMap } from './IsoBoxWriterMap.ts'

/**
 * Configuration for `writeIsoBox`, `writeIsoBoxes`, and `createIsoBoxReadableStream`.
 *
 * @public
 */
export type IsoBoxWriteConfig = {
	/**
	 * A map from box type to writer. With no map, a write takes only containers, byte arrays, and boxes with a `view`.
	 */
	writers?: IsoBoxWriterMap
}
