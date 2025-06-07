import type { IsoData } from './IsoData.js';
import { IsoView } from './IsoView.js';
import type { IsoViewConfig } from './IsoViewConfig.js';

/**
 * Create an IsoView from a raw ISO data.
 *
 * @param raw - The raw ISO data
 * @param config - The configuration for the IsoView
 *
 * @returns The created IsoView
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function createIsoView(raw: IsoData, config?: IsoViewConfig): IsoView {
	return new IsoView(raw, config);
}
