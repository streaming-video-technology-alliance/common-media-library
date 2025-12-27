import type { Fields } from './boxes/types/Fields.ts'
import type { IsoBox } from './boxes/types/IsoBox.ts'
import type { IsoBoxReadView } from './IsoBoxReadView.ts'
import type { IsoBoxReadViewConfig } from './IsoBoxReadViewConfig.ts'

/**
 * Box parser
 *
 * @public
 */
export type IsoBoxReader<B extends IsoBox = IsoBox> = {
	read: (view: IsoBoxReadView, config?: IsoBoxReadViewConfig) => Fields<B>;
}
