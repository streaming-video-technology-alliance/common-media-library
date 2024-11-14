import type { Box } from './Box.js';
import type { IsoView } from './IsoView.js';
import type { IsoViewConfig } from './IsoViewConfig.js';

export type BoxParser<V = any> = (view: IsoView, config?: IsoViewConfig) => Box<V>;
