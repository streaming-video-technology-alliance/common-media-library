import type { IsoData } from './IsoData';
import { IsoView } from './IsoView.ts';
import type { IsoViewConfig } from './IsoViewConfig';

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
	return raw instanceof IsoView ? raw : new IsoView(raw, config);
}
