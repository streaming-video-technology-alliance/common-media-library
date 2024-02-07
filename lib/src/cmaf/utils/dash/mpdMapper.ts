import { AdaptationSet, DashManifest, Representation, SegmentMpd } from './DashManifest';
import { Presentation } from '../../ham/Presentation';
import { SelectionSet } from '../../ham/SelectionSet';
import { Segment } from '../../ham/Segment';
import { Track } from '../../ham/Track';

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
		Period: [
			{
				$: {
					duration: hamManifest.duration.toString(),
				},
				AdaptationSet: selectionToAdapationSet(hamManifest.selectionSets),
			},
		],
	};
}

export { mapHamToMpd };
