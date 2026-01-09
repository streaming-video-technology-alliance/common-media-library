import type { IsoBoxReader } from './IsoBoxReader.ts'

/**
 * A map of box parsers to their box types
 *
 * @public
 */
export type IsoBoxReaderMap = Record<string, IsoBoxReader>
