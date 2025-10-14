import type { Presentation } from '../../types/model/Presentation.ts';

import { DashMapper } from '../../mapper/dash/DashMapper.ts';
import { MapperContext } from '../../mapper/MapperContext.ts';


/**
 * Convert dash manifest into a ham object.
 *
 * @example
 * Example on how to import the cmaf module and convert the dash `manifest`
 * into the ham manifest.
 * ```ts
 * import cmaf from '@svta/common-media-library/cmaf-ham';
 *
 * const manifest = cmaf.dashToHam(dashManifest);
 * ```
 *
 * @param manifest - String of the XML Dash manifest
 * @returns List of presentations from ham
 *
 * @alpha
 */

export function dashToHam(manifest: string): Presentation[] {
	const mapperContext: MapperContext = MapperContext.getInstance();
	mapperContext.setStrategy(new DashMapper());
	return mapperContext.getHamFormat({ manifest, type: 'dash' });
}
