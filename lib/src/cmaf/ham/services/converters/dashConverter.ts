import { DashMapper } from '../../mapper/DashMapper.js';
import { MapperContext } from '../../mapper/MapperContext.js';
import type { Presentation } from '../../types/model';
import type { Manifest } from '../../types';

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
 * @param manifest - String of the XML Dash manifest.
 * @returns List of presentations from ham.
 *
 * @group CMAF
 * @alpha
 */

function dashToHam(manifest: string): Presentation[] {
	const mapperContext: MapperContext = MapperContext.getInstance();
	mapperContext.setStrategy(new DashMapper());
	return mapperContext.getHamFormat({ manifest, type: 'dash' });
}

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
 * @param presentation - List of presentations from ham.
 * @returns Manifest object containing the Dash manifest as string.
 *
 * @group CMAF
 * @alpha
 */
function hamToDash(presentation: Presentation[]): Manifest {
	const mapperContext: MapperContext = MapperContext.getInstance();
	mapperContext.setStrategy(new DashMapper());
	return mapperContext.getManifestFormat(presentation);
}

export { dashToHam, hamToDash };
