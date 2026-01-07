import type { SwitchingSet } from '../../../types/model/SwitchingSet.ts'
import type { TextTrack } from '../../../types/model/TextTrack.ts'

import type { ManifestFile } from '../../../types/manifest/ManifestFile.ts'

import { parseHlsManifest } from '../../../utils/hls/parseHlsManifest.ts'

import { formatSegments } from './utils/formatSegments.ts'
import { getDuration } from './utils/getDuration.ts'
import { getHlsCodec } from './utils/getHlsCodec.ts'

export function subtitleGroupsToSwitchingSets(
	mediaGroupsSubtitles: any,
	manifestPlaylists: ManifestFile[],
): SwitchingSet[] {
	const subtitleSwitchingSets: SwitchingSet[] = []
	const textTracks: TextTrack[] = []

	// Add selection set of type subtitles
	for (const subtitleEncodings in mediaGroupsSubtitles) {
		const encodings = mediaGroupsSubtitles[subtitleEncodings]
		for (const subtitle in encodings) {
			const attributes = encodings[subtitle]
			const { language, uri } = attributes
			const subtitleParsed = parseHlsManifest(
				manifestPlaylists.shift()?.manifest,
			)
			const segments = formatSegments(subtitleParsed?.segments)

			const codec = getHlsCodec('text')
			textTracks.push({
				id: subtitle,
				type: 'text',
				url: uri,
				codecs: codec ? [codec] : [],
				mimeType: 'text/vtt',
				duration: getDuration(subtitleParsed, segments),
				language: language,
				bandwidth: 0,
				segments: segments,
				initialization: {
					url: '',
				},
				baseUrls: [],
			} as TextTrack)
		}
	}

	subtitleSwitchingSets.push({
		id: 'text',
		tracks: textTracks,
		baseUrls: [],
	} as SwitchingSet)

	return subtitleSwitchingSets
}
