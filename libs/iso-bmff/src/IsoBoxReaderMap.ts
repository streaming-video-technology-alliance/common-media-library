import type { IsoBoxReader } from './IsoBoxReader.ts'
import type { IsoBoxType } from './IsoBoxType.ts'

/**
 * A map of box parsers to their box types
 *
 * @public
 */
export type IsoBoxReaderMap = Record<IsoBoxType, IsoBoxReader>
