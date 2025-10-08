import type { Manifest } from '../../types/manifest/Manifest.js';
import type { Presentation } from '../../types/model/Presentation.js';

import { HlsMapper } from '../../mapper/hls/HlsMapper.js';
import { MapperContext } from '../../mapper/MapperContext.js';

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
 * @param presentation - List of presentations from ham
 * @returns Manifest object containing the Hls manifest as string and its playlists
 *
 * @alpha
 */
export function hamToHls(presentation: Presentation[]): Manifest {
	const mapperContext = MapperContext.getInstance();
	mapperContext.setStrategy(new HlsMapper());
	return mapperContext.getManifestFormat(presentation);
}
