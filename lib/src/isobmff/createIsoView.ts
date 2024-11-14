import type { IsoData } from './IsoData.js';
import { IsoView } from './IsoView.js';
import type { IsoViewConfig } from './IsoViewConfig.js';

export function createIsoView(raw: IsoData, config?: IsoViewConfig): IsoView {
	return raw instanceof IsoView ? raw : new IsoView(raw, config);
}
