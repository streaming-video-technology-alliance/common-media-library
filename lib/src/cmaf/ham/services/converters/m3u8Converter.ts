import { HLSMapper } from '../../mapper/HLSMapper.js';
import { MapperContext } from '../../mapper/MapperContext.js';
import { Presentation } from '../../types/model';

/**
 * Convert hls manifest into a ham object.
 *
 * @param manifest - Main manifest.
 * @param ancillaryManifests - Ancillary Manifests . Must be in order, first audio, subtitle and video.
 */

function m3u8ToHam(manifest: string, ancillaryManifests: string[]) {
	const mapperContext = MapperContext.getInstance();
	mapperContext.setStrategy(new HLSMapper());
	return mapperContext.getHamFormat({
		manifest,
		ancillaryManifests: ancillaryManifests.map((ancillaryManifest) => ({
			manifest: ancillaryManifest,
			type: 'm3u8',
		})),
		type: 'm3u8',
	});
}

/**
 * Convert ham object into a hls manifest.
 *
 * @param presentation - Ham object. List of presentations.
 */

function hamToM3U8(presentation: Presentation[]) {
	const mapperContext = MapperContext.getInstance();
	mapperContext.setStrategy(new HLSMapper());
	return mapperContext.getManifestFormat(presentation);
}


export { m3u8ToHam, hamToM3U8 };
