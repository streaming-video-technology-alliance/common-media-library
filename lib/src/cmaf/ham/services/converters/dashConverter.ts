import { DashMapper } from '../../mapper/DashMapper.js';
import { MapperContext } from '../../mapper/MapperContext.js';
import type { Presentation } from '../../types/model/index.js';
import type { Manifest } from '../../types/index.js';

/**
 * Convert dash manifest into a ham object.
 *
 * @param manifest -  Manifest dash.
 *
 * @returns Presentation[]
 *
 * @group CMAF
 *
 * @alpha
 */

function dashToHam(manifest: string): Presentation[] {
	const mapperContext: MapperContext = MapperContext.getInstance();
	mapperContext.setStrategy(new DashMapper());
	return mapperContext.getHamFormat({ manifest, type: 'dash' });
}

/**
 * Convert dash manifest into a ham object.
 *
 * @param presentation - Ham object. List of presentations.
 *
 * @returns Manifest
 *
 * @group CMAF
 *
 * @alpha
 */
function hamToDash(presentation: Presentation[]): Manifest {
	const mapperContext: MapperContext = MapperContext.getInstance();
	mapperContext.setStrategy(new DashMapper());
	return mapperContext.getManifestFormat(presentation);
}

export { dashToHam, hamToDash };
