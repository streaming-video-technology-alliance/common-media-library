import { HLSMapper } from '../../mapper/HLSMapper';
import { MapperContext } from '../../mapper/MapperContext';
import { Presentation } from '../../types/model';

function hlsToHam(manifest: string, anciallaryManifests: string[]) {
	const mapperContext = MapperContext.getInstance();
	mapperContext.setStrategy(new HLSMapper());
	return mapperContext.getHamFormat({
		manifest,
		anciallaryManifests: anciallaryManifests.map((ancillaryManifest) => ({
			manifest: ancillaryManifest,
			type: 'm3u8',
		})),
		type: 'm3u8',
	});
}

function hamToHls(presentation: Presentation[]) {
	const mapperContext = MapperContext.getInstance();
	mapperContext.setStrategy(new HLSMapper());
	return mapperContext.getManifestFormat(presentation);
}

export { hlsToHam, hamToHls };
