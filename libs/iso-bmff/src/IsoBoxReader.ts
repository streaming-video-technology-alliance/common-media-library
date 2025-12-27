import type { Fields } from './boxes/Fields.ts'
import type { IsoBox } from './boxes/IsoBox.ts'
import type { IsoBoxReadView } from './IsoBoxReadView.ts'
import type { IsoBoxReadViewConfig } from './IsoBoxReadViewConfig.ts'

/**
 * Box parser
 *
 * @public
 */
export type IsoBoxReader<V = IsoBox> = (view: IsoBoxReadView, config?: IsoBoxReadViewConfig) => Fields<V>;
