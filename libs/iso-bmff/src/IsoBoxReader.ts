import type { IsoBox } from './IsoBox.ts'
import type { IsoBoxReadView } from './IsoBoxReadView.ts'

/**
 * ISO BMFF box reader
 *
 * @public
 */
export type IsoBoxReader<B extends IsoBox> = (view: IsoBoxReadView) => B;
