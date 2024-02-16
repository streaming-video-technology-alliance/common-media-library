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
						duration: parseDurationMpd(hamManifest.duration),
					},
					AdaptationSet: selectionToAdapationSet(hamManifest.selectionSets),
				},
			],
		},
	};
}

export { mapHamToMpd };
