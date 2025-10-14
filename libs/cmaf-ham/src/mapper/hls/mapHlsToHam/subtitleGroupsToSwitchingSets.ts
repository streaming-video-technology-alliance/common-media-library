import type { SwitchingSet } from '../../../types/model/SwitchingSet.js';
import type { TextTrack } from '../../../types/model/TextTrack.js';

import type { Manifest } from '../../../types/manifest/Manifest.js';

import { parseHlsManifest } from '../../../utils/hls/parseHlsManifest.js';

import { formatSegments } from './utils/formatSegments.js';
import { getDuration } from './utils/getDuration.js';
import { getHlsCodec } from './utils/getHlsCodec.ts';

export function subtitleGroupsToSwitchingSets(
	mediaGroupsSubtitles: any,
	manifestPlaylists: Manifest[],
): SwitchingSet[] {
	const subtitleSwitchingSets: SwitchingSet[] = [];
	const textTracks: TextTrack[] = [];

	// Add selection set of type subtitles
	for (const subtitleEncodings in mediaGroupsSubtitles) {
		const encodings = mediaGroupsSubtitles[subtitleEncodings];
		for (const subtitle in encodings) {
			const attributes = encodings[subtitle];
			const { language, uri } = attributes;
			const subtitleParsed = parseHlsManifest(
				manifestPlaylists.shift()?.manifest,
			);
			const segments = formatSegments(subtitleParsed?.segments);

			textTracks.push({
				id: subtitle,
				type: 'text',
				fileName: uri,
				codec: getHlsCodec('text'),
				duration: getDuration(subtitleParsed, segments),
				language: language,
				bandwidth: 0,
				segments: segments,
			} as TextTrack);
		}
	}

	subtitleSwitchingSets.push({
		id: 'text',
		tracks: textTracks,
	} as SwitchingSet);

	return subtitleSwitchingSets;
}
