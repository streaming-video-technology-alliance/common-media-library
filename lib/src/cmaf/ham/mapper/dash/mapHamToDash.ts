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
} from '../../types/model/index.js';
import { numberToIso8601Duration } from '../../utils/utils.js';
import { getFrameRate, getTimescale } from './utilsHamToDash.js';
import { jsonToXml } from '../../utils/xmlUtils.js';

function mapHamToDash(hamManifests: Presentation[]): string {
	const periods: Period[] = _presentationsToPeriods(hamManifests);
	const duration: string = periods[0].$.duration;
	const manifest: DashManifest = {
		MPD: {
			$: {
				mediaPresentationDuration: duration,
				type: 'static',
			},
			Period: periods,
		},
	};

	return jsonToXml(manifest);
}

function _presentationsToPeriods(presentations: Presentation[]): Period[] {
	return presentations.map((presentation: Presentation) => {
		return {
			$: {
				duration: numberToIso8601Duration(
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
					contentType: track?.type,
					mimeType: `${track?.type}/mp4`,
					frameRate: getFrameRate(track),
					lang: track?.language,
					codecs: track?.codec,
				},
				Representation: _tracksToRepresentation(switchingSet.tracks),
			} as AdaptationSet;
		});
	});
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
		const timescale = getTimescale(track);
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

function _trackToSegmentBase(track: Track): SegmentBase[] {
	const segments: SegmentBase[] = [];
	if (
		track.segments.length > 0 &&
		track.byteRange &&
		track.segments[0].byteRange &&
		track.segments[0].byteRange.includes('@')
	) {
		let firstSegment: SegmentBase | undefined = undefined;
		const initByteRange = track.byteRange.includes('-')
			? track.byteRange.split('-')[1]
			: track.byteRange.includes('@')
				? track.byteRange.split('@')[0]
				: '';
		const initRange: number = +initByteRange - 1;
		const byteFirstSegment = track.segments[0].byteRange.includes('-')
			? track.segments[0].byteRange.split('-')[1]
			: track.segments[0].byteRange.includes('@')
				? track.segments[0].byteRange.split('@')[1]
				: '';
		const numberFirstByteRange: number = +byteFirstSegment - 1;
		firstSegment = {
			$: {
				indexRange: `${initByteRange}-${numberFirstByteRange}`,
			},
			Initialization: [{ $: { range: `0-${initRange}` } }],
		} as SegmentBase;
		if (firstSegment && track.type === 'audio') {
			// All segments should have timescale, but for now, just the audio ones store this value
			const audioTrack = track as AudioTrack;
			firstSegment.$.timescale = audioTrack.sampleRate.toString() ?? '';
		}
		if (firstSegment) {
			segments.push(firstSegment);
		}
	} else {
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
	}

	return segments;
}

export { mapHamToDash };
