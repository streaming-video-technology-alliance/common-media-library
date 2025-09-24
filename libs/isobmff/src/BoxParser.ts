import type { Fields } from './boxes/Fields.js';
import type { IsoBox } from './boxes/IsoBox.js';
import type { IsoView } from './IsoView.js';
import type { IsoViewConfig } from './IsoViewConfig.js';

/**
 * Box parser
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type BoxParser<V = IsoBox> = (view: IsoView, config?: IsoViewConfig) => Fields<V>;
