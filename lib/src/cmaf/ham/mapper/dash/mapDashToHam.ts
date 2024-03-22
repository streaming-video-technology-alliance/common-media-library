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
} from '../../types/model';
import { iso8601DurationToNumber } from '../../../utils/utils.js';
import {
	calculateDuration,
	getChannels,
	getCodec,
	getContentType,
	getFrameRate,
	getGroup,
	getLanguage,
	getNumberOfSegments,
	getPresentationId,
	getSampleRate,
	getSar,
	getTrackDuration,
	getUrlFromTemplate,
} from './utilsDashToHam.js';

function mapTracks(
	representation: Representation,
	adaptationSet: AdaptationSet,
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

function mapSegmentBase(
	representation: Representation,
	duration: number,
): Segment[] {
	return representation.SegmentBase!.map((segment: SegmentBase) => {
		return {
			duration: duration,
			url: representation.BaseURL![0] ?? '',
			byteRange: segment.$.indexRange,
		} as Segment;
	});
}

function mapSegmentList(representation: Representation): Segment[] {
	const segments: Segment[] = [];
	representation.SegmentList!.map((segment: SegmentList) => {
		segments.push({
			duration: 0, // TODO: Check if it is correct that the init segment has duration 0
			url: segment.Initialization[0].$.sourceURL ?? '',
		} as Segment);
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

function mapSegments(
	representation: Representation,
	duration: number,
	segmentTemplate?: SegmentTemplate,
): Segment[] {
	if (representation.SegmentBase) {
		return mapSegmentBase(representation, duration);
	} else if (representation.SegmentList) {
		return mapSegmentList(representation);
	} else if (segmentTemplate) {
		return mapSegmentTemplate(representation, duration, segmentTemplate);
	} else {
		console.error(`Representation ${representation.$.id} has no segments`);
		return [] as Segment[];
	}
}

function getInitializationUrl(
	representation: Representation,
	adaptationSet: AdaptationSet,
): string | undefined {
	let initializationUrl: string | undefined;
	if (representation.SegmentBase) {
		initializationUrl = representation.BaseURL![0] ?? '';
	} else if (representation.SegmentList) {
		initializationUrl =
			representation.SegmentList[0].Initialization[0].$.sourceURL;
	}
	if (adaptationSet.SegmentTemplate || representation.SegmentTemplate) {
		initializationUrl =
			adaptationSet.SegmentTemplate?.at(0)?.$.initialization ||
			representation.SegmentTemplate?.at(0)?.$.initialization;
		if (initializationUrl?.includes('$RepresentationID$')) {
			initializationUrl = initializationUrl.replace(
				'$RepresentationID$',
				representation.$.id ?? '',
			);
		}
	}
	return initializationUrl;
}

function mapDashToHam(dash: DashManifest): Presentation[] {
	return dash.MPD.Period.map((period: Period) => {
		const duration: number = iso8601DurationToNumber(period.$.duration);
		const presentationId: string = getPresentationId(period, duration);

		const selectionSetGroups: { [group: string]: SelectionSet } = {};

		period.AdaptationSet.map((adaptationSet: AdaptationSet) => {
			const tracks: Track[] = adaptationSet.Representation.map(
				(representation: Representation) => {
					const segmentTemplate: SegmentTemplate | undefined =
						adaptationSet.SegmentTemplate?.at(0) ??
						representation.SegmentTemplate?.at(0);
					const segments: Segment[] = mapSegments(
						representation,
						duration,
						segmentTemplate,
					);

					return mapTracks(
						representation,
						adaptationSet,
						segments,
						getInitializationUrl(representation, adaptationSet),
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

export {
	getInitializationUrl,
	mapDashToHam,
	mapSegments,
	mapSegmentTemplate,
	mapSegmentList,
	mapSegmentBase,
	mapTracks,
};
