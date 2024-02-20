import { AdaptationSet, DashManifest, Representation, SegmentMpd } from './DashManifest.js';
import { Presentation, SelectionSet, Segment, Track } from '../../ham/model/index.js';
import { parseDurationMpd } from '../utils.js';

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
				bandwidth: track.bandwidth.toString(),
			},
			SegmentBase: baseSegmentToSegment(track.segments),
		};
	});
}

function selectionToAdaptationSet(selectionsSets: SelectionSet[]): AdaptationSet[] {
	return selectionsSets.flatMap((selectionSet) => {
		return selectionSet.switchingSets.map((switchingSet) => {
			return {
				$: {
					id: switchingSet.id,
					group: selectionSet.id,
					contentType: switchingSet.type,
					lang: switchingSet.language,
					codecs: switchingSet.codec,
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
						duration: parseDurationMpd(hamManifest.selectionSets[0].switchingSets[0].tracks[0].duration),
					},
					AdaptationSet: selectionToAdaptationSet(hamManifest.selectionSets),
				},
			],
		},
	};
}

export { mapHamToMpd };
