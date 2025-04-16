import type { AudioTrack } from '../../../types/model/AudioTrack.ts';
import type { SwitchingSet } from '../../../types/model/SwitchingSet.ts';

import type { Manifest } from '../../../types/manifest/Manifest.ts';

import { parseHlsManifest } from '../../../utils/hls/parseHlsManifest.ts';

import { getDuration } from './utils/getDuration.ts';
import { getCodec } from './utils/getCodec.ts';
import { getByterange } from './utils/getByterange.ts';
import { formatSegments } from './utils/formatSegments.ts';

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
 * @group CMAF
 * @alpha
 */
export function audioGroupsToSwitchingSets(
	mediaGroupsAudio: any,
	manifestPlaylists: Manifest[],
): SwitchingSet[] {
	const audioSwitchingSets: SwitchingSet[] = [];
	const audioTracks: AudioTrack[] = [];

	for (const audioEncodings in mediaGroupsAudio) {
		const encodings = mediaGroupsAudio[audioEncodings];
		for (const audio in encodings) {
			const attributes: any = encodings[audio];
			const { language, uri } = attributes;
			const audioParsed = parseHlsManifest(
				manifestPlaylists.shift()?.manifest,
			);
			const map = audioParsed?.segments[0]?.map;
			const segments = formatSegments(audioParsed?.segments);

			// TODO: channels, sampleRate, bandwith and codec need to be
			// updated with real values. Right now we are using simple hardcoded values.
			const byteRange = getByterange(map?.byterange);
			audioTracks.push({
				id: audio,
				type: 'audio',
				fileName: uri,
				codec: getCodec('audio'),
				duration: getDuration(audioParsed, segments),
				language: language,
				bandwidth: 0,
				segments: segments,
				sampleRate: 0,
				channels: 2,
				...(byteRange && { byteRange }),
				...(map?.uri && { urlInitialization: map?.uri }),
			} as AudioTrack);
		}
	}

	audioSwitchingSets.push({
		id: 'audio',
		tracks: audioTracks,
	} as SwitchingSet);

	return audioSwitchingSets;
}
