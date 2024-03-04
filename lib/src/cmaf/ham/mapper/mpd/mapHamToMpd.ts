import type {
	AdaptationSet,
	AudioChannelConfiguration,
	DashManifest,
	Period,
	Representation,
	SegmentBase,
	SegmentList,
	SegmentURL,
} from '../../types/DashManifest';
import type {
	AudioTrack,
	Presentation,
	Segment,
	SelectionSet,
	TextTrack,
	Track,
	VideoTrack,
} from '../../types/model';
import { parseDurationMpd } from '../../../utils/utils.js';

function getTimescale(track: Track): string {
	if (track.type === 'audio') {
		const audioTrack = track as AudioTrack;
		return audioTrack.sampleRate.toString();
	}
	if (track.type === 'video') {
		// Fixme: Sometimes this is correct, sometimes this is wrong
		const videoTrack = track as VideoTrack;
		return Math.round(videoTrack.duration / 10).toString();
	}
	if (track.type === 'text') {
		// TODO: Most likely wrong
		const textTrack = track as TextTrack;
		return Math.round(textTrack.duration / 10).toString();
	}
	return '24';
}

// TODO: This only maps to SegmentBase, it may need to handle all Segment types
function baseSegmentToSegment(hamSegments: Segment[]): SegmentBase[] {
	const segments: SegmentBase[] = [];
	hamSegments.forEach((segment) => {
		if (segment.byteRange) {
			segments.push({
				$: {
					indexRange: segment.byteRange,
				},
				Initialization: [{ $: { range: segment.byteRange } }],
			} as SegmentBase);
		}
	});

	return segments;
}

function SegmentToSegmentList(track: Track): SegmentList[] {
	const segmentList: SegmentList[] = [];
	const segmentURLs: SegmentURL[] = [];
	track.segments.forEach((segment, index) => {
		if (index > 0) {
			segmentURLs.push({
				$: {
					media: segment.url,
				},
			});
		}
	});

	if (!track.segments.at(0)?.byteRange) {
		segmentList.push({
			$: {
				duration: track.duration.toString(),
				timescale: getTimescale(track),
			},
			Initialization: [{ $: { sourceURL: track.segments.at(0)?.url } }],
			SegmentURL: segmentURLs,
		} as SegmentList);
	}
	return segmentList;
}

function trackToRepresentation(tracks: Track[]): Representation[] {
	return tracks.map((track) => {
		const representation: Representation = {
			$: {
				id: track.id,
				bandwidth: track.bandwidth.toString(),
			},
			SegmentBase: baseSegmentToSegment(track.segments),
			SegmentList: SegmentToSegmentList(track),
		} as Representation;
		if (track.type === 'video') {
			const videoTrack = track as VideoTrack;
			representation.$ = {
				...representation.$,
				width: videoTrack.width.toString(),
				height: videoTrack.height.toString(),
				codecs: videoTrack.codec,
				scanType: videoTrack.scanType,
			};
		}
		if (track.type === 'audio') {
			const audioTrack = track as AudioTrack;
			representation.AudioChannelConfiguration = [
				{
					$: {
						schemeIdUri: '',
						value: audioTrack.sampleRate.toString() ?? '',
					},
				} as AudioChannelConfiguration,
			];
		}
		return representation;
	});
}

function selectionToAdaptationSet(
	selectionsSets: SelectionSet[],
): AdaptationSet[] {
	return selectionsSets.flatMap((selectionSet) => {
		return selectionSet.switchingSets.map((switchingSet) => {
			return {
				$: {
					id: switchingSet.id,
					group: selectionSet.id,
					contentType: switchingSet.tracks[0].type,
					mimeType: switchingSet.tracks[0].name,
					frameRate: (switchingSet.tracks[0] as VideoTrack).frameRate,
					lang: switchingSet.tracks[0].language,
					codecs: switchingSet.tracks[0].codec,
				},
				Representation: trackToRepresentation(switchingSet.tracks),
			} as AdaptationSet;
		});
	});
}

function mapHamToMpd(hamManifests: Presentation[]): DashManifest {
	const periods = hamManifests.map((presentation) => {
		return {
			$: {
				// FIXME: this value is wrong
				duration: parseDurationMpd(
					presentation.selectionSets[0].switchingSets[0].tracks[0]
						.duration,
				),
				id: presentation.id,
				start: 'PT0S',
			},
			AdaptationSet: selectionToAdaptationSet(presentation.selectionSets),
		} as Period;
	});

	return {
		MPD: {
			$: {
				type: 'static',
			},
			Period: periods,
		},
	};
}

export { mapHamToMpd };
