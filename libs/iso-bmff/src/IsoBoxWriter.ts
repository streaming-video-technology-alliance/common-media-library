import type { Fields } from './boxes/types/Fields.ts'
import type { IsoBox } from './boxes/types/IsoBox.ts'
import type { IsoBoxWriteView } from './IsoBoxWriteView.ts'

/**
 * ISO box writer.
 *
 * @public
 */
export type IsoBoxWriter<B extends IsoBox> = {
	write: (box: Fields<B>) => IsoBoxWriteView;
}
