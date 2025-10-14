import type { IsoData } from './IsoData.ts';
import { IsoView } from './IsoView.ts';
import type { IsoViewConfig } from './IsoViewConfig.ts';

/**
 * Create an IsoView from a raw ISO data.
 *
 * @param raw - The raw ISO data
 * @param config - The configuration for the IsoView
 *
 * @returns The created IsoView
 *
 *
 * @beta
 */
export function createIsoView(raw: IsoData, config?: IsoViewConfig): IsoView {
	return new IsoView(raw, config);
}
