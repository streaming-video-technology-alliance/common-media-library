import type { AdaptationSet } from '../../../types/mapper/dash/AdaptationSet.js';
import type { Representation } from '../../../types/mapper/dash/Representation.js';

import type { AudioTrack } from '../../../types/model/AudioTrack.js';
import type { Segment } from '../../../types/model/Segment.js';
import type { TextTrack } from '../../../types/model/TextTrack.js';
import type { VideoTrack } from '../../../types/model/VideoTrack.js';


import { getChannels } from './utils/getChannels.js';
import { getCodec } from './utils/getCodec.js';
import { getContentType } from './utils/getContentType.js';
import { getFrameRate } from './utils/getFrameRate.js';
import { getLanguage } from './utils/getLanguage.js';
import { getSampleRate } from './utils/getSampleRate.js';
import { getSar } from './utils/getSar.js';
import { getTrackDuration } from './utils/getTrackDuration.js';

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
