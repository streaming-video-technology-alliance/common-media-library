import type { Fields } from './boxes/Fields.ts'
import type { IsoBox } from './boxes/IsoBox.ts'
import type { IsoBoxReadView } from './IsoBoxReadView.ts'
import type { IsoBoxReadViewConfig } from './IsoBoxReadViewConfig.ts'

/**
 * ISO BMFF box reader
 *
 * @public
 */
export type IsoBoxReader<B extends IsoBox> = (view: IsoBoxReadView, config?: IsoBoxReadViewConfig) => Fields<B>;
