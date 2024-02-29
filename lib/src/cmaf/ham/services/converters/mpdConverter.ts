import { MPDMapper } from '../../mapper/MPDMapper.js';
import { MapperContext } from '../../mapper/MapperContext.js';
import { Presentation } from '../../types/model';

/**
 * Convert mpd manifest into a ham object.
 *
 * @param manifest -  Manifest mpd.
 */

function mpdToHam(manifest: string) {
	const mapperContext = MapperContext.getInstance();
	mapperContext.setStrategy(new MPDMapper());
	return mapperContext.getHamFormat({ manifest, type: 'mpd' });
}

/**
 * Convert mpd manifest into a ham object.
 *
 * @param presentation - Ham object. List of presentations.
 */
function hamToMPD(presentation: Presentation[]) {
	const mapperContext = MapperContext.getInstance();
	mapperContext.setStrategy(new MPDMapper());
	return mapperContext.getManifestFormat(presentation);
}

export { mpdToHam, hamToMPD };
