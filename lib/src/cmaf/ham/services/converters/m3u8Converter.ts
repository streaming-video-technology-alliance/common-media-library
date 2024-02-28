import { HLSMapper } from '../../mapper/HLSMapper';
import { MapperContext } from '../../mapper/MapperContext';
import { Presentation } from '../../types/model';

function m3u8ToHam(manifest: string, anciallaryManifests: string[]) {
	const mapperContext = MapperContext.getInstance();
	mapperContext.setStrategy(new HLSMapper());
	return mapperContext.getHamFormat({
		manifest,
		ancillaryManifests: anciallaryManifests.map((ancillaryManifest) => ({
			manifest: ancillaryManifest,
			type: 'm3u8',
		})),
		type: 'm3u8',
	});
}

function hamToM3U8(presentation: Presentation[]) {
	const mapperContext = MapperContext.getInstance();
	mapperContext.setStrategy(new HLSMapper());
	return mapperContext.getManifestFormat(presentation);
}

export { m3u8ToHam, hamToM3U8 };
