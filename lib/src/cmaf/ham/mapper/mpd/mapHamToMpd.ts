import type {
	AdaptationSet,
	DashManifest,
	Representation,
	SegmentBase,
	SegmentList,
	SegmentURL,
} from '../../types/DashManifest';
import type {
	Presentation,
	Segment,
	SelectionSet,
	Track,
	VideoTrack,
} from '../../types/model';
import { parseDurationMpd } from '../../../utils/utils.js';


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
		segmentList.push(
			{
				$: {
					duration: track.duration.toString(),
					timescale: '24',
				},
				Initialization: [{ $: { sourceURL: track.segments.at(0)?.url } }],
				SegmentURL: segmentURLs,
			} as SegmentList,
		);
	};

	return segmentList;
}

function trackToRepresentation(tracks: Track[]): Representation[] {
	return tracks.map((track) => {
		let videoProps;
		if (track.type === 'video') {
			const videoTrack = track as VideoTrack;
			videoProps = {
				id: videoTrack.id,
				bandwidth: videoTrack.bandwidth.toString(),
				width: videoTrack.width.toString(),
				height: videoTrack.height.toString(),
				codecs: videoTrack.codec,
				scanType: videoTrack.scanType,
			};
		}
		return {
			$: videoProps ?? {
				id: track.id,
				bandwidth: track.bandwidth.toString(),
			},
			SegmentBase: baseSegmentToSegment(track.segments),
			SegmentList: SegmentToSegmentList(track),
		};
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
	const periods = hamManifests.map((hamManifest) => {
		return {
			$: {
				duration: parseDurationMpd(
					hamManifest.selectionSets[0].switchingSets[0].tracks[0]
						.duration,
				),
			},
			AdaptationSet: selectionToAdaptationSet(hamManifest.selectionSets),
		};
	});

	return {
		MPD: {
			Period: periods,
		},
	};
}

export { mapHamToMpd };
