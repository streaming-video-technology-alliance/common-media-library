
import type { Representation } from '../../../types/mapper/dash/Representation.js';
import type { AudioChannelConfiguration } from '../../../types/mapper/dash/AudioChannelConfiguration.js';

import type { AudioTrack } from '../../../types/model/AudioTrack.js';
import type { Track } from '../../../types/model/Track.js';
import type { VideoTrack } from '../../../types/model/VideoTrack.js';

import { trackToSegmentBase } from './trackToSegmentBase.js';
import { trackToSegmentList } from './trackToSegmentList.js';

import { getFrameRate } from './utils/getFrameRate.js';

export function tracksToRepresentation(tracks: Track[]): Representation[] {
	return tracks.map((track) => {
		const representation: Representation = {
			$: {
				id: track.id,
				bandwidth: track.bandwidth.toString(),
			},
			SegmentBase: trackToSegmentBase(track),
			SegmentList: trackToSegmentList(track),
		} as Representation;
		representation.$.mimeType = `${track.type}/mp4`; //Harcoded value
		if (track.type === 'video') {
			const videoTrack = track as VideoTrack;
			representation.$ = {
				...representation.$,
				frameRate: getFrameRate(track),
				width: videoTrack.width.toString(),
				height: videoTrack.height.toString(),
				codecs: videoTrack.codec,
			};
			if (videoTrack.scanType) {
				representation.$.scanType = videoTrack.scanType;
			}
		}
		if (track.type === 'audio') {
			const audioTrack = track as AudioTrack;
			representation.$ = {
				...representation.$,
				audioSamplingRate: audioTrack.sampleRate.toString(),
				codecs: audioTrack.codec,
			};
			representation.AudioChannelConfiguration = [
				{
					$: {
						schemeIdUri:
							'urn:mpeg:dash:23003:3:audio_channel_configuration:2011', // hardcoded value
						value: audioTrack.channels.toString() ?? '',
					},
				} as AudioChannelConfiguration,
			];
		}
		if (track.segments[0]?.byteRange) {
			// Only BaseSegments have byteRange on segments, and BaseURL on the representation
			representation.BaseURL = [track.segments[0].url];
		}
		return representation;
	});
}
