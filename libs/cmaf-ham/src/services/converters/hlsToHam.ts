import type { Presentation } from '../../types/model/Presentation.ts';

import { HlsMapper } from '../../mapper/hls/HlsMapper.ts';
import { MapperContext } from '../../mapper/MapperContext.ts';

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
 * @param manifest - String of the Main manifest
 * @param ancillaryManifests - Ancillary Manifests . Must be in order, first audio, subtitle and video
 * @returns List of presentations from ham
 *
 * @alpha
 */
export function hlsToHam(
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
