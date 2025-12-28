import type { IsoBox } from './boxes/IsoBox.ts'
import type { IsoBoxReader } from './IsoBoxReader.ts'

/**
 * A map of box parsers to their box types
 *
 * @public
 */
export type IsoBoxReaderMap = Partial<{
	[P in IsoBox['type']]: IsoBoxReader<Extract<IsoBox, Record<'type', P>>>
}>

