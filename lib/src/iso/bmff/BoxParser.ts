import type { IsoView } from './IsoView';
import type { IsoViewConfig } from './IsoViewConfig';

/**
 * Box parser
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type BoxParser<V = any> = (view: IsoView, config?: IsoViewConfig) => V;
