import { HlsMapper } from '../../mapper/Mapper.js';
import { MapperContext } from '../../mapper/MapperContext.js';
import type { Presentation } from '../../types/model/index.js';

/**
 * Convert hls manifest into a ham object.
 *
 * @param manifest - Main manifest.
 * @param ancillaryManifests - Ancillary Manifests . Must be in order, first audio, subtitle and video.
 *
 * @returns Presentation[]
 *
 * @group CMAF
 *
 * @alpha
 */

function hlsToHam(manifest: string, ancillaryManifests: string[]) {
	const mapperContext = MapperContext.getInstance();
	mapperContext.setStrategy(new HlsMapper());
	return mapperContext.getHamFormat({
		manifest,
		ancillaryManifests: ancillaryManifests.map((ancillaryManifest) => ({
			manifest: ancillaryManifest,
			type: 'hls',
		})),
		type: 'hls',
	});
}

/**
 * Convert ham object into a hls manifest.
 *
 * @param presentation - Ham object. List of presentations.
 *
 * @returns Manifest
 *
 * @group CMAF
 *
 * @alpha
 */

function hamToHls(presentation: Presentation[]) {
	const mapperContext = MapperContext.getInstance();
	mapperContext.setStrategy(new HlsMapper());
	return mapperContext.getManifestFormat(presentation);
}

export { hlsToHam, hamToHls };
