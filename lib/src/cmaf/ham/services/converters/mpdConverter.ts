import { MPDMapper } from '../../mapper/MPDMapper';
import { MapperContext } from '../../mapper/MapperContext';
import { Presentation } from '../../types/model';

function mpdToHam(manifest: string) {
	const mapperContext = MapperContext.getInstance();
	mapperContext.setStrategy(new MPDMapper());
	return mapperContext.getHamFormat({ manifest, type: 'mpd' });
}

function hamToMPD(presentation: Presentation[]) {
	const mapperContext = MapperContext.getInstance();
	mapperContext.setStrategy(new MPDMapper());
	return mapperContext.getManifestFormat(presentation);
}

export { mpdToHam, hamToMPD };
