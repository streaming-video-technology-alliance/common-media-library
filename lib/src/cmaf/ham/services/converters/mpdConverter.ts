import { MPDMapper } from '../../mapper/MPDMapper.js';
import { MapperContext } from '../../mapper/MapperContext.js';
import type { Presentation } from '../../types/model';
import type { Manifest } from '../../types';

/**
 * Convert mpd manifest into a ham object.
 *
 * @param manifest -  Manifest mpd.
 *
 * @returns Presentation[]
 *
 * @group CMAF
 *
 * @alpha
 */

function mpdToHam(manifest: string): Presentation[] {
	const mapperContext: MapperContext = MapperContext.getInstance();
	mapperContext.setStrategy(new MPDMapper());
	return mapperContext.getHamFormat({ manifest, type: 'mpd' });
}

/**
 * Convert mpd manifest into a ham object.
 *
 * @param presentation - Ham object. List of presentations.
 *
 * @returns Manifest
 *
 * @group CMAF
 *
 * @alpha
 */
function hamToMpd(presentation: Presentation[]): Manifest {
	const mapperContext: MapperContext = MapperContext.getInstance();
	mapperContext.setStrategy(new MPDMapper());
	return mapperContext.getManifestFormat(presentation);
}

export { mpdToHam, hamToMpd };
