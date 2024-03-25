import type {
	AdaptationSet,
	AudioChannelConfiguration,
	DashManifest,
	Period,
	Representation,
	SegmentBase,
	SegmentList,
	SegmentURL,
} from '../../types';
import type {
	AudioTrack,
	Presentation,
	Segment,
	SelectionSet,
	Track,
	VideoTrack,
} from '../../types/model';
import { parseDurationDash } from '../../../utils/utils.js';
import {
	ZERO,
	TIMESCALE_1000,
	TIMESCALE_48000,
	TIMESCALE_90000,
} from '../../../utils/constants.js';

/**
 * This function tries to recreate the timescale value.
 *
 * This value is not stored on the ham object, so it is not possible (for now)
 * to get the original one.
 *
 * Just the audio tracks have this value stored on the `sampleRate` key.
 *
 * Using 90000 as default for video since it is divisible by 24, 25 and 30
 *
 * Using 1000 as default for text
 *
 * @param track - Track to get the timescale from
 * @returns Timescale in numbers
 */
function _getTimescale(track: Track): number {
	if (track.type === 'audio') {
		const audioTrack = track as AudioTrack;
		return audioTrack.sampleRate !== 0
			? audioTrack.sampleRate
			: TIMESCALE_48000;
	}
	if (track.type === 'video') {
		return TIMESCALE_90000;
	}
	if (track.type === 'text') {
		return TIMESCALE_1000;
	}
	return TIMESCALE_90000;
}

function _getFrameRate(track: Track): string | undefined {
	let frameRate: string | undefined = undefined;
	const videoTrack = track as VideoTrack;
	if (track.type === 'video') {
		frameRate = `${videoTrack.frameRate.frameRateNumerator}`;
		frameRate =
			videoTrack.frameRate.frameRateDenominator !== ZERO
				? `${frameRate}/${videoTrack.frameRate.frameRateDenominator}`
				: frameRate;
	}

	return frameRate;
}

function _trackToSegmentBase(track: Track): SegmentBase[] {
	const segments: SegmentBase[] = [];
	track.segments.forEach((segment: Segment) => {
		let newSegment: SegmentBase | undefined;
		if (segment.byteRange) {
			const initRange: number = +segment.byteRange.split('-')[0] - 1;
			newSegment = {
				$: {
					indexRange: segment.byteRange,
				},
				Initialization: [{ $: { range: `0-${initRange}` } }],
			} as SegmentBase;
		}
		if (newSegment && track.type === 'audio') {
			// All segments should have timescale, but for now, just the audio ones store this value
			const audioTrack = track as AudioTrack;
			newSegment.$.timescale = audioTrack.sampleRate.toString() ?? '';
		}
		if (newSegment) {
			segments.push(newSegment);
		}
	});

	return segments;
}

function _trackToSegmentList(track: Track): SegmentList[] {
	const segmentList: SegmentList[] = [];
	const segmentURLs: SegmentURL[] = [];
	track.segments.forEach((segment) => {
		segmentURLs.push({
			$: {
				media: segment.url,
			},
		});
	});

	if (!track.segments.at(0)?.byteRange) {
		const timescale = _getTimescale(track);
		segmentList.push({
			$: {
				duration: (
					(track.duration * timescale) /
					segmentURLs.length
				).toString(),
				timescale: timescale.toString(),
			},
			Initialization: [{ $: { sourceURL: track.urlInitialization } }],
			SegmentURL: segmentURLs,
		} as SegmentList);
	}
	return segmentList;
}

function _tracksToRepresentation(tracks: Track[]): Representation[] {
	return tracks.map((track) => {
		const representation: Representation = {
			$: {
				id: track.id,
				bandwidth: track.bandwidth.toString(),
			},
			SegmentBase: _trackToSegmentBase(track),
			SegmentList: _trackToSegmentList(track),
		} as Representation;
		representation.$.mimeType = `${track.type}/mp4`; //Harcoded value
		if (track.type === 'video') {
			const videoTrack = track as VideoTrack;
			representation.$ = {
				...representation.$,
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

function _selectionSetsToAdaptationSet(
	selectionsSets: SelectionSet[],
): AdaptationSet[] {
	return selectionsSets.flatMap((selectionSet) => {
		return selectionSet.switchingSets.map((switchingSet) => {
			const track = switchingSet.tracks[0];
			return {
				$: {
					id: switchingSet.id,
					group: selectionSet.id,
					contentType: track.type,
					mimeType: `${track.type}/mp4`,
					frameRate: _getFrameRate(track),
					lang: track.language,
					codecs: track.codec,
				},
				Representation: _tracksToRepresentation(switchingSet.tracks),
			} as AdaptationSet;
		});
	});
}

function _presentationsToPeriods(presentations: Presentation[]): Period[] {
	return presentations.map((presentation: Presentation) => {
		return {
			$: {
				duration: parseDurationDash(
					presentation.selectionSets[0].switchingSets[0].tracks[0]
						.duration,
				),
				id: presentation.id,
				start: 'PT0S',
			},
			AdaptationSet: _selectionSetsToAdaptationSet(
				presentation.selectionSets,
			),
		} as Period;
	});
}

function mapHamToDash(hamManifests: Presentation[]): DashManifest {
	const periods: Period[] = _presentationsToPeriods(hamManifests);
	const duration: string = periods[0].$.duration;

	return {
		MPD: {
			$: {
				mediaPresentationDuration: duration,
				type: 'static',
			},
			Period: periods,
		},
	};
}

export { mapHamToDash };
