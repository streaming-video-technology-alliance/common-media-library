import type { IsoBox } from './IsoBox.ts'
import type { IsoBoxReader } from './IsoBoxReader.ts'
import type { IsoBoxReadView } from './IsoBoxReadView.ts'
import type { IsoBoxType } from './IsoBoxType.ts'

/**
 * A map of box parsers to their box types
 *
 * @public
 */
export type IsoBoxReaderMap = {
	[P in IsoBox['type']]?: IsoBoxReader<Extract<IsoBox, { type: P }>>
} & Record<IsoBoxType, ((view: IsoBoxReadView) => { type: IsoBoxType }) | undefined>
