import type { IsoView } from './IsoView.js';
import type { IsoViewConfig } from './IsoViewConfig.js';

/**
 * Box parser
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type BoxParser<V = any> = (view: IsoView, config?: IsoViewConfig) => V;
