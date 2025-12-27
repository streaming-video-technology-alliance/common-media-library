import type { IsoBox } from './boxes/types/IsoBox.ts'
import type { IsoBoxWriter } from './IsoBoxWriter.ts'

/**
 * A map of box writers to their box types
 *
 * @public
 */
export type IsoBoxWriterMap = Record<string, IsoBoxWriter<IsoBox>>;
