import type { AdaptationSet } from '../../../types/mapper/dash/AdaptationSet.ts';
import type { Representation } from '../../../types/mapper/dash/Representation.ts';

import type { AudioTrack } from '../../../types/model/AudioTrack.ts';
import type { Segment } from '../../../types/model/Segment.ts';
import type { TextTrack } from '../../../types/model/TextTrack.ts';
import type { VideoTrack } from '../../../types/model/VideoTrack.ts';


import { getChannels } from './utils/getChannels.ts';
import { getCodec } from './utils/getCodec.ts';
import { getContentType } from './utils/getContentType.ts';
import { getFrameRate } from './utils/getFrameRate.ts';
import { getLanguage } from './utils/getLanguage.ts';
import { getSampleRate } from './utils/getSampleRate.ts';
import { getSar } from './utils/getSar.ts';
import { getTrackDuration } from './utils/getTrackDuration.ts';

/**
 * @internal
 *
 * Map dash components to ham tracks.
 *
 * @param adaptationSet - AdaptationSet of the dash manifest
 * @param representation - Representation of the dash manifest
 * @param segments - Segments from the representation of the dash manifest
 * @param initializationUrl - Initialization url from the track
 * @returns AudioTrack, VideoTrack or TextTrack depending on the type
 */
export function mapTracks(
	adaptationSet: AdaptationSet,
	representation: Representation,
	segments: Segment[],
	initializationUrl: string | undefined,
): AudioTrack | VideoTrack | TextTrack {
	if (!adaptationSet) {
		throw new Error('Error: AdaptationSet is undefined');
	}
	const type = getContentType(adaptationSet, representation);
	if (type === 'video') {
		return {
			bandwidth: +(representation.$.bandwidth ?? 0),
			codec: getCodec(adaptationSet, representation),
			duration: getTrackDuration(segments),
			frameRate: getFrameRate(adaptationSet, representation),
			height: +(representation.$.height ?? 0),
			id: representation.$.id ?? '',
			language: getLanguage(adaptationSet),
			par: adaptationSet.$.par ?? '',
			sar: getSar(adaptationSet, representation),
			scanType: representation.$.scanType ?? '',
			segments,
			type,
			width: +(representation.$.width ?? 0),
			urlInitialization: initializationUrl,
		} as VideoTrack;
	}
	else if (type === 'audio') {
		return {
			bandwidth: +(representation.$.bandwidth ?? 0),
			channels: getChannels(adaptationSet, representation),
			codec: getCodec(adaptationSet, representation),
			duration: getTrackDuration(segments),
			id: representation.$.id ?? '',
			language: getLanguage(adaptationSet),
			sampleRate: getSampleRate(adaptationSet, representation),
			segments,
			type,
			urlInitialization: initializationUrl,
		} as AudioTrack;
	}
	else {
		// if (type === 'text')
		return {
			bandwidth: +(representation.$.bandwidth ?? 0),
			codec: getCodec(adaptationSet, representation),
			duration: getTrackDuration(segments),
			id: representation.$.id ?? '',
			language: getLanguage(adaptationSet),
			segments,
			type,
			urlInitialization: initializationUrl,
		} as TextTrack;
	}
}
