import type { Fields } from './boxes/Fields.ts'
import type { IsoBox } from './boxes/IsoBox.ts'
import type { IsoView } from './IsoView.ts'
import type { IsoViewConfig } from './IsoViewConfig.ts'

/**
 * Box parser
 *
 *
 * @beta
 */
export type BoxParser<V = IsoBox> = (view: IsoView, config?: IsoViewConfig) => Fields<V>;
