import { Manifest } from '../../types';
import type { Presentation } from '../../types/model';
import { HlsMapper } from '../../mapper/HlsMapper.js';
import { MapperContext } from '../../mapper/MapperContext.js';

/**
 * Convert hls manifest into a ham object.
 *
 * @example
 * Example on how to import the cmaf module and convert the hls `manifest` and
 * `ancillaryManifests` array into the ham manifest.
 * ```ts
 * import cmaf from '@svta/common-media-library/cmaf-ham';
 *
 * const manifest = cmaf.hlsToHam(hlsManifest);
 * ```
 *
 * @param manifest - String of the Main manifest.
 * @param ancillaryManifests - Ancillary Manifests . Must be in order, first audio, subtitle and video.
 * @returns List of presentations from ham.
 *
 * @group CMAF
 * @alpha
 */
function hlsToHam(
	manifest: string,
	ancillaryManifests: string[],
): Presentation[] {
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
 * @example
 * Example on how to import the cmaf module and convert the ham `presentations`
 * array into the hls manifest.
 * ```ts
 * import cmaf from '@svta/common-media-library/cmaf-ham';
 *
 * const manifest = cmaf.hamToHls(presentations);
 * ```
 *
 * @param presentation - List of presentations from ham.
 * @returns Manifest object containing the Hls manifest as string and its playlists.
 *
 * @group CMAF
 * @alpha
 */
function hamToHls(presentation: Presentation[]): Manifest {
	const mapperContext = MapperContext.getInstance();
	mapperContext.setStrategy(new HlsMapper());
	return mapperContext.getManifestFormat(presentation);
}

export { hlsToHam, hamToHls };
