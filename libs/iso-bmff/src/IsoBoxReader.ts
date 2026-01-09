import type { IsoBoxReadView } from './IsoBoxReadView.ts'

/**
 * ISO BMFF box reader
 *
 * @public
 */
export type IsoBoxReader<B = unknown> = (view: IsoBoxReadView) => B;
