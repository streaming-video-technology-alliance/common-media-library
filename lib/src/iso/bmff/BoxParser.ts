import type { IsoView } from './IsoView.ts';
import type { IsoViewConfig } from './IsoViewConfig.ts';

/**
 * Box parser
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type BoxParser<V = any> = (view: IsoView, config?: IsoViewConfig) => V;
