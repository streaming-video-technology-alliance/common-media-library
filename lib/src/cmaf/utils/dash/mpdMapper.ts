import { AdaptationSet, DashManifest, Representation, SegmentMpd } from './DashManifest.js';
import { Presentation, SelectionSet, Segment, Track } from '../../ham/model/index.js';

function baseSegmentToSegment(hamSegments: Segment[]): SegmentMpd[] {
	return hamSegments.map((segment) => {
		return {
			$: {
				indexRange: segment.byteRange,
			},
			Initialization: [{ $: { range: segment.byteRange } }],
		};
	});
}

function trackToRepresentation(tracks: Track[]): Representation[] {
	return tracks.map((track) => {
		return {
			$: {
				id: track.id,
				bandwidth: track.bandwidth,
			},
			SegmentBase: baseSegmentToSegment(track.segments),
		};
	});
}

function selectionToAdapationSet(selectionsSets: SelectionSet[]): AdaptationSet[] {
	return selectionsSets.flatMap((selectionSet) => {
		return selectionSet.switchingSet.map((switchingSet) => {
			return {
				$: {
					id: switchingSet.id,
					group: selectionSet.id,
					contentType: switchingSet.tracks[0].type,
					lang: switchingSet.tracks[0].language,
					codecs: switchingSet.tracks[0].codec,
				},
				Representation: trackToRepresentation(switchingSet.tracks),
			};
		});
	});
}

function mapHamToMpd(hamManifest: Presentation): DashManifest {
	return {
		MPD: {
			Period: [
				{
					$: {
						duration: hamManifest.selectionSets[0].switchingSet[0].tracks[0].duration.toString(),
					},
					AdaptationSet: selectionToAdapationSet(hamManifest.selectionSets),
				},
			],
		},
	};
}

export { mapHamToMpd };
