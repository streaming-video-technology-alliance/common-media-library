import type {
	AdaptationSet,
	DashManifest,
	Period,
	Representation,
	SegmentBase,
	SegmentList,
	SegmentTemplate,
	SegmentURL,
} from '../../types';
import type {
	AudioTrack,
	Presentation,
	Segment,
	SelectionSet,
	SwitchingSet,
	TextTrack,
	Track,
	VideoTrack,
} from '../../types/model/index.js';
import { iso8601DurationToNumber } from '../../utils/utils.js';
import {
	calculateDuration,
	getChannels,
	getCodec,
	getContentType,
	getFrameRate,
	getGroup,
	getInitializationUrl,
	getLanguage,
	getNumberOfSegments,
	getPresentationId,
	getSampleRate,
	getSar,
	getTrackDuration,
	getUrlFromTemplate,
} from './utilsDashToHam.js';

/**
 * @internal
 *
 * Main function to map dash to ham.
 *
 * @param dash - Dash manifest to map
 * @returns List of presentations in ham
 */
function mapDashToHam(dash: DashManifest): Presentation[] {
	return dash.MPD.Period.map((period: Period) => {
		const duration: number = iso8601DurationToNumber(period.$.duration);
		const presentationId: string = getPresentationId(period, duration);

		const selectionSetGroups: { [group: string]: SelectionSet } = {};

		period.AdaptationSet.map((adaptationSet: AdaptationSet) => {
			const tracks: Track[] = adaptationSet.Representation.map(
				(representation: Representation) => {
					const segments: Segment[] = mapSegments(
						adaptationSet,
						representation,
						duration,
					);

					return mapTracks(
						adaptationSet,
						representation,
						segments,
						getInitializationUrl(adaptationSet, representation),
					);
				},
			);

			const group: string = getGroup(adaptationSet);
			if (!selectionSetGroups[group]) {
				selectionSetGroups[group] = {
					id: group,
					switchingSets: [],
				} as SelectionSet;
			}

			selectionSetGroups[group].switchingSets.push({
				id:
					adaptationSet.$.id ??
					adaptationSet.ContentComponent?.at(0)?.$.id ??
					group,
				tracks,
			} as SwitchingSet);
		});

		const selectionSets: SelectionSet[] = Object.values(selectionSetGroups);

		return { id: presentationId, selectionSets } as Presentation;
	});
}

/**
 * @internal
 *
 * Map dash components to ham tracks.
 *
 * @param adaptationSet - AdaptationSet of the dash manifest
 * @param representation - Representation of the dash manifest
 * @param segments - Segments from the representation of the dash manifest
 * @param initializationUrl - Initialization url from the track
 * @returns AudioTrack, VideoTrack or TextTrack depending on the type
 */
function mapTracks(
	adaptationSet: AdaptationSet,
	representation: Representation,
	segments: Segment[],
	initializationUrl: string | undefined,
): AudioTrack | VideoTrack | TextTrack {
	if (!adaptationSet) {
		throw new Error('Error: AdaptationSet is undefined');
	}
	const type = getContentType(adaptationSet, representation);
	if (type === 'video') {
		return {
			bandwidth: +(representation.$.bandwidth ?? 0),
			codec: getCodec(adaptationSet, representation),
			duration: getTrackDuration(segments),
			frameRate: getFrameRate(adaptationSet, representation),
			height: +(representation.$.height ?? 0),
			id: representation.$.id ?? '',
			language: getLanguage(adaptationSet),
			par: adaptationSet.$.par ?? '',
			sar: getSar(adaptationSet, representation),
			scanType: representation.$.scanType ?? '',
			segments,
			type,
			width: +(representation.$.width ?? 0),
			urlInitialization: initializationUrl,
		} as VideoTrack;
	} else if (type === 'audio') {
		return {
			bandwidth: +(representation.$.bandwidth ?? 0),
			channels: getChannels(adaptationSet, representation),
			codec: getCodec(adaptationSet, representation),
			duration: getTrackDuration(segments),
			id: representation.$.id ?? '',
			language: getLanguage(adaptationSet),
			sampleRate: getSampleRate(adaptationSet, representation),
			segments,
			type,
			urlInitialization: initializationUrl,
		} as AudioTrack;
	} else {
		// if (type === 'text')
		return {
			bandwidth: +(representation.$.bandwidth ?? 0),
			codec: getCodec(adaptationSet, representation),
			duration: getTrackDuration(segments),
			id: representation.$.id ?? '',
			language: getLanguage(adaptationSet),
			segments,
			type,
			urlInitialization: initializationUrl,
		} as TextTrack;
	}
}

/**
 * @internal
 *
 * Maps SegmentBase from dash to Segment list from ham.
 *
 * @param representation - Representation to get the SegmentBase from
 * @param duration - Duration of the segment
 * @returns list of ham segments
 */
function mapSegmentBase(
	representation: Representation,
	duration: number,
): Segment[] {
	return representation.SegmentBase!.map((segment: SegmentBase) => {
		return {
			duration,
			url: representation.BaseURL![0] ?? '',
			byteRange: segment.$.indexRange,
		} as Segment;
	});
}

/**
 * @internal
 *
 * Maps SegmentList from dash to Segment list from ham.
 *
 * @param segmentList - SegmentList list from dash
 * @returns list of ham segments
 */
function mapSegmentList(segmentList: SegmentList[]): Segment[] {
	const segments: Segment[] = [];
	segmentList.map((segment: SegmentList) => {
		if (segment.SegmentURL) {
			return segment.SegmentURL.forEach((segmentURL: SegmentURL) => {
				segments.push({
					duration: calculateDuration(
						segment.$.duration,
						segment.$.timescale,
					),
					url: segmentURL.$.media ?? '',
				} as Segment);
			});
		}
	});
	return segments;
}

/**
 * @internal
 *
 * Maps SegmentTemplate from dash to Segment list from ham.
 *
 * @param representation - Representation to generate the urls
 * @param duration - Duration of the segments
 * @param segmentTemplate - SegmentTemplate to get the properties from
 * @returns list of ham segments
 */
function mapSegmentTemplate(
	representation: Representation,
	duration: number,
	segmentTemplate: SegmentTemplate,
): Segment[] {
	const numberOfSegments: number = getNumberOfSegments(
		segmentTemplate,
		duration,
	);
	const init: number = +(segmentTemplate.$.startNumber ?? 0);
	const segments: Segment[] = [];
	for (let id = init; id < numberOfSegments + init; id++) {
		segments.push({
			duration: calculateDuration(
				segmentTemplate.$.duration,
				segmentTemplate.$.timescale,
			),
			url: getUrlFromTemplate(representation, segmentTemplate, id),
		} as Segment);
	}
	return segments;
}

/**
 * @internal
 *
 * Maps dash segments to ham segment.
 *
 * Checks the type of dash segments used to map them accordingly.
 * @see mapSegmentBase
 * @see mapSegmentList
 * @see mapSegmentTemplate
 *
 * @param adaptationSet - AdaptationSet to get the segments from
 * @param representation - Representation to get the segments from
 * @param duration - Duration of the segments
 * @returns list of ham segments
 */
function mapSegments(
	adaptationSet: AdaptationSet,
	representation: Representation,
	duration: number,
): Segment[] {
	const segmentTemplate: SegmentTemplate | undefined =
		adaptationSet.SegmentTemplate?.at(0) ??
		representation.SegmentTemplate?.at(0);
	const segmentList: SegmentList[] | undefined =
		adaptationSet.SegmentList ?? representation.SegmentList;
	if (representation.SegmentBase) {
		return mapSegmentBase(representation, duration);
	} else if (segmentList) {
		return mapSegmentList(segmentList);
	} else if (segmentTemplate) {
		return mapSegmentTemplate(representation, duration, segmentTemplate);
	} else {
		console.error(`Representation ${representation.$.id} has no segments`);
		return [] as Segment[];
	}
}

export {
	mapDashToHam,
	mapSegments,
	mapSegmentTemplate,
	mapSegmentList,
	mapSegmentBase,
	mapTracks,
};
