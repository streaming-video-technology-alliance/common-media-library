import type { IsoBoxWriterMap } from './IsoBoxWriterMap.ts'

/**
 * Configuration for the IsoBoxReadableStream.
 *
 * @public
 */
export type IsoBoxReadableStreamConfig = {
	/**
	 * A map of box writers to their box types
	 */
	writers?: IsoBoxWriterMap;
};
