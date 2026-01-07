import type { AudioTrack } from '../../../types/model/AudioTrack.ts'
import type { SwitchingSet } from '../../../types/model/SwitchingSet.ts'

import type { ManifestFile } from '../../../types/manifest/ManifestFile.ts'

import { parseHlsManifest } from '../../../utils/hls/parseHlsManifest.ts'

import { decodeByteRange } from './utils/decodeByteRange.ts'
import { formatSegments } from './utils/formatSegments.ts'
import { getDuration } from './utils/getDuration.ts'
import { getHlsCodec } from './utils/getHlsCodec.ts'

/**
 * @internal
 *
 * This function is used to convert audio groups to switching sets.
 *
 *
 * @param mediaGroupsAudio - Any
 * @param manifestPlaylists - Array of Manifest
 * @returns Array of switchingSet
 *
 * @alpha
 */
export function audioGroupsToSwitchingSets(
	mediaGroupsAudio: any,
	manifestPlaylists: ManifestFile[],
): SwitchingSet[] {
	const audioSwitchingSets: SwitchingSet[] = []
	const audioTracks: AudioTrack[] = []

	for (const audioEncodings in mediaGroupsAudio) {
		const encodings = mediaGroupsAudio[audioEncodings]
		for (const audio in encodings) {
			const attributes: any = encodings[audio]
			const { language, uri } = attributes
			const audioParsed = parseHlsManifest(
				manifestPlaylists.shift()?.manifest,
			)
			const map = audioParsed?.segments[0]?.map
			const segments = formatSegments(audioParsed?.segments)

			// TODO: channels, sampleRate, bandwith and codec need to be
			// updated with real values. Right now we are using simple hardcoded values.
			const byteRange = decodeByteRange(map?.byterange)
			audioTracks.push({
				id: audio,
				type: 'audio',
				fileName: uri,
				codec: getHlsCodec('audio'),
				duration: getDuration(audioParsed, segments),
				language: language,
				bandwidth: 0,
				segments: segments,
				sampleRate: 0,
				channels: 2,
				...(byteRange && { byteRange }),
				...(map?.uri && { urlInitialization: map?.uri }),
			} as AudioTrack)
		}
	}

	audioSwitchingSets.push({
		id: 'audio',
		tracks: audioTracks,
		baseUrls: [],
	} as SwitchingSet)

	return audioSwitchingSets
}
