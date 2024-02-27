import {
	AdaptationSet,
	DashManifest,
	Representation,
	SegmentTemplate,
} from '../utils/dash/DashManifest.js';
import {
	AudioTrack,
	Presentation,
	Segment,
	SelectionSet,
	SwitchingSet,
	TextTrack,
	Track,
	VideoTrack,
} from './types/model/index.js';
import { iso8601DurationToNumber } from '../utils/utils.js';

function getContentType(adaptationSet: AdaptationSet): string {
	if (adaptationSet.$.contentType) {
		return adaptationSet.$.contentType;
	}
	return adaptationSet.ContentComponent![0].$.contentType;
}

function getGroup(adaptationSet: AdaptationSet): string {
	return adaptationSet.$.group ?? getContentType(adaptationSet);
}

function createTrack(
	representation: Representation,
	adaptationSet: AdaptationSet,
	duration: number,
	segments: Segment[],
): AudioTrack | VideoTrack | TextTrack {
	const type = getContentType(adaptationSet);
	if (type === 'video') {
		return {
			bandwidth: +representation.$.bandwidth,
			codec: representation.$.codecs,
			duration: duration,
			frameRate: 0, // TODO: add frameRate
			height: +(representation.$.height ?? 0),
			id: representation.$.id,
			language: adaptationSet.$.lang,
			par: adaptationSet.$.par ?? '',
			sar: adaptationSet.$.sar ?? '',
			scanType: representation.$.scanType,
			segments: segments,
			type: adaptationSet.$.contentType,
			width: +(representation.$.width ?? 0),
		} as VideoTrack;
	} else if (type === 'audio') {
		return {
			bandwidth: +representation.$.bandwidth,
			channels: +(
				adaptationSet.AudioChannelConfiguration![0].$.value ?? 0
			),
			codec: adaptationSet.$.codecs,
			duration: duration,
			id: representation.$.id,
			language: adaptationSet.$.lang,
			sampleRate: +(adaptationSet.$.audioSamplingRate ?? 0),
			segments: segments,
			type: adaptationSet.$.contentType,
		} as AudioTrack;
	} else {
		// if (type === 'text')
		return {
			bandwidth: +representation.$.bandwidth,
			codec: adaptationSet.$.codecs,
			duration: duration,
			id: representation.$.id,
			language: adaptationSet.$.lang,
			segments: segments,
			type: adaptationSet.$.contentType,
		} as TextTrack;
	}
}

function getUrlFromTemplate(
	representation: Representation,
	segmentTemplate: SegmentTemplate,
): string {
	const regex = /\$(.*?)\$/g;
	return segmentTemplate.$.media.replace(regex, (match) => {
		// TODO: This may have a better way to do it for all the cases
		if (match === '$RepresentationID$') {
			return representation.$.id;
		}
		console.log(
			`Unknown property on representation ${representation.$.id}`,
		);
		return match;
	});
}

function mpdSegmentsToHamSegments(
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
		return representation.SegmentList.map((segment) => {
			return {
				duration: +(segment.$.duration ?? 0),
				url: segment.Initialization[0].$.sourceURL ?? '',
				byteRange: '', // TODO: Complete this value
			} as Segment;
		});
	} else if (segmentTemplate) {
		return [
			{
				duration: +(segmentTemplate.$.duration ?? 0),
				url: getUrlFromTemplate(representation, segmentTemplate),
				byteRange: '', // TODO: Complete this value
			} as Segment,
		];
	} else {
		console.error(`Representation ${representation.$.id} has no segments`);
		return [] as Segment[];
	}
}

function mapMpdToHam(rawManifest: DashManifest): Presentation {
	const presentation: Presentation[] = rawManifest.MPD.Period.map(
		(period) => {
			const duration: number = iso8601DurationToNumber(period.$.duration);
			// const url: string = 'url'; // todo: get real url
			const presentationId: string = 'presentation-id'; // todo: handle id

			const selectionSetGroups: { [group: string]: SelectionSet } = {};

			period.AdaptationSet.map((adaptationSet) => {
				const tracks: Track[] = adaptationSet.Representation.map(
					(representation) => {
						const segments = mpdSegmentsToHamSegments(
							representation,
							duration,
							adaptationSet.SegmentTemplate![0],
						);

						return createTrack(
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
					id: adaptationSet.$.id,
					tracks,
				} as SwitchingSet);
			});

			const selectionSets: SelectionSet[] =
				Object.values(selectionSetGroups);

			return { id: presentationId, selectionSets } as Presentation;
		},
	);

	return presentation[0];
}

export { mapMpdToHam };
