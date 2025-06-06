import type { Manifest } from '../../types/manifest/Manifest.js';
import type { Presentation } from '../../types/model/Presentation.js';

import { DashMapper } from '../../mapper/dash/DashMapper.js';
import { MapperContext } from '../../mapper/MapperContext.js';

/**
 * Convert HAM object into Dash Manifest.
 *
 * @example
 * Example on how to import the cmaf module and convert the ham `presentations`
 * array into the dash manifest.
 * ```ts
 * import cmaf from '@svta/common-media-library/cmaf-ham';
 *
 * const manifest = cmaf.hamToDash(presentations);
 * ```
 *
 * @param presentation - List of presentations from ham
 * @returns Manifest object containing the Dash manifest as string
 *
 * @group CMAF
 * @alpha
 */
export function hamToDash(presentation: Presentation[]): Manifest {
	const mapperContext: MapperContext = MapperContext.getInstance();
	mapperContext.setStrategy(new DashMapper());
	return mapperContext.getManifestFormat(presentation);
}

