import type {
	AdaptationSet,
	DashManifest,
	Period,
	Representation,
	SegmentTemplate,
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
	getChannels,
	getCodec,
	getContentType,
	getDuration,
	getFrameRate,
	getGroup,
	getLanguage,
	getName,
	getNumberOfSegments,
	getPresentationId,
	getSampleRate,
	getSar,
	getUrlFromTemplate,
} from './mpdMapperUtils.js';

function mapTracks(
	representation: Representation,
	adaptationSet: AdaptationSet,
	duration: number,
	segments: Segment[],
): AudioTrack | VideoTrack | TextTrack {
	if (!adaptationSet) {
		throw new Error('Error: AdaptationSet is undefined');
	}
	const type = getContentType(adaptationSet, representation);
	if (type === 'video') {
		return {
			name: getName(adaptationSet, representation, type),
			bandwidth: +(representation.$.bandwidth ?? 0),
			codec: getCodec(adaptationSet, representation),
			duration: getDuration(representation) || duration,
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
		} as VideoTrack;
	} else if (type === 'audio') {
		return {
			name: getName(adaptationSet, representation, type),
			bandwidth: +(representation.$.bandwidth ?? 0),
			channels: getChannels(adaptationSet, representation),
			codec: getCodec(adaptationSet, representation),
			duration: getDuration(representation) || duration,
			id: representation.$.id ?? '',
			language: getLanguage(adaptationSet),
			sampleRate: getSampleRate(adaptationSet, representation),
			segments,
			type,
		} as AudioTrack;
	} else {
		// if (type === 'text')
		return {
			name: type,
			bandwidth: +(representation.$.bandwidth ?? 0),
			codec: getCodec(adaptationSet, representation),
			duration,
			id: representation.$.id ?? '',
			language: getLanguage(adaptationSet),
			segments,
			type,
		} as TextTrack;
	}
}

function mapSegments(
	representation: Representation,
	duration: number,
	segmentTemplate?: SegmentTemplate,
): Segment[] {
	if (representation.SegmentBase) {
		return representation.SegmentBase.map((segment) => {
			return {
				duration,
				url: representation.BaseURL![0] ?? '',
				byteRange: segment.$.indexRange,
			} as Segment;
		});
	} else if (representation.SegmentList) {
		const segments: Segment[] = [];
		representation.SegmentList.map((segment) => {
			segments.push({
				duration: +(segment.$.duration ?? 0),
				url: segment.Initialization[0].$.sourceURL ?? '',
				byteRange: '', // TODO: Complete this value
			} as Segment);
			if (segment.SegmentURL) {
				return segment.SegmentURL.forEach((segmentURL) => {
					segments.push({
						duration: +(segment.$.duration ?? 0),
						url: segmentURL.$.media ?? '',
						byteRange: '', // TODO: Complete this value
					} as Segment);
				});
			}
		});
		return segments;
	} else if (segmentTemplate) {
		const numberOfSegments = getNumberOfSegments(segmentTemplate, duration);
		const init = +(segmentTemplate.$.startNumber ?? 0);
		const segments: Segment[] = [];
		for (let id = init; id < numberOfSegments + init; id++) {
			segments.push({
				duration: +(segmentTemplate.$.duration ?? 0),
				url: getUrlFromTemplate(representation, segmentTemplate, id),
				byteRange: '', // TODO: Complete this value
			} as Segment);
		}
		return segments;
	} else {
		console.error(`Representation ${representation.$.id} has no segments`);
		return [] as Segment[];
	}
}

function mapMpdToHam(mpd: DashManifest): Presentation[] {
	return mpd.MPD.Period.map((period: Period) => {
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
						duration,
						segments,
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

export { mapMpdToHam };
