import type { SwitchingSet } from '../../../types/model/SwitchingSet';
import type { TextTrack } from '../../../types/model/TextTrack';

import type { Manifest } from '../../../types/manifest/Manifest';

import { parseHlsManifest } from '../../../utils/hls/parseHlsManifest.ts';

import { formatSegments } from './utils/formatSegments.ts';
import { getCodec } from './utils/getCodec.ts';
import { getDuration } from './utils/getDuration.ts';

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
				codec: getCodec('text'),
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
