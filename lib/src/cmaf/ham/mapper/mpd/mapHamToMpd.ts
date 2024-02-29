import {
	AdaptationSet,
	MPDManifest,
	Representation,
	SegmentBase,
} from '../../types/DashManifest.js';
import {
	Presentation,
	Segment,
	SelectionSet,
	Track,
	VideoTrack,
} from '../../types/model';
import { parseDurationMpd } from '../../../utils/utils.js';

// TODO: This only maps to SegmentBase, it may need to handle all Segment types
function baseSegmentToSegment(hamSegments: Segment[]): SegmentBase[] {
	return hamSegments.map((segment) => {
		return {
			$: {
				indexRange: segment.byteRange,
			},
			Initialization: [{ $: { range: segment.byteRange } }],
		} as SegmentBase;
	});
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
					lang: switchingSet.tracks[0].language,
					codecs: switchingSet.tracks[0].codec,
				},
				Representation: trackToRepresentation(switchingSet.tracks),
			} as AdaptationSet;
		});
	});
}

function mapHamToMpd(hamManifests: Presentation[]): MPDManifest {
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
