import type { IsoBox } from './boxes/IsoBox.ts'
import type { IsoBoxWriter } from './IsoBoxWriter.ts'

/**
 * A map of box writers to their box types
 *
 * @public
 */
export type IsoBoxWriterMap = Partial<{
	[P in IsoBox['type']]: IsoBoxWriter<Extract<IsoBox, Record<'type', P>>>
}>
