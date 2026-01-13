import type { IsoBoxReadView } from './IsoBoxReadView.ts'
import type { IsoBoxType } from './IsoBoxType.ts'

/**
 * ISO BMFF box reader
 *
 * @public
 */
export type IsoBoxReader<B = unknown, T extends IsoBoxType = IsoBoxType> = (view: IsoBoxReadView, type: T) => B;
