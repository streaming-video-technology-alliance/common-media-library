import type { Fields } from './boxes/Fields.ts'
import type { IsoBoxWriteView } from './IsoBoxWriteView.ts'

/**
 * ISO box writer.
 *
 * @public
 */
export type IsoBoxWriter<B> = (box: Fields<B>) => IsoBoxWriteView;
