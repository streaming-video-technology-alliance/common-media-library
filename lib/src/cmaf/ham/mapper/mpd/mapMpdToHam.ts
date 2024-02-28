import {
	AdaptationSet,
	MPDManifest,
	Period,
	Representation,
	SegmentTemplate,
} from '../../types/DashManifest';
import {
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

function getContentType(
	adaptationSet: AdaptationSet,
	representation?: Representation,
): string {
	if (!adaptationSet) {
		throw new Error('Error: AdaptationSet is undefined');
	}
	if (adaptationSet.$.contentType) {
		return adaptationSet.$.contentType;
	}
	if (adaptationSet.ContentComponent?.at(0)) {
		return adaptationSet.ContentComponent.at(0)!.$.contentType;
	}
	if (representation?.$.mimeType) {
		const type = representation.$.mimeType.split('/')[0];
		if (type === 'audio' || type === 'video' || type === 'text') {
			return type;
		}
		if (type === 'application') {
			return 'text';
		}
	}
	if (adaptationSet.$.maxHeight) {
		return 'video';
	}
	const adaptationRef =
		adaptationSet.$.id ??
		`group: ${adaptationSet.$.group}, lang: ${adaptationSet.$.lang}`;
	console.info(
		`Could not find contentType from adaptationSet ${adaptationRef}`,
	);
	console.info('Using "text" as default contentType');
	return 'text';
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
	if (!adaptationSet) {
		throw new Error('Error: AdaptationSet is undefined');
	}
	const type = getContentType(adaptationSet, representation);
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
				adaptationSet.AudioChannelConfiguration?.at(0)?.$.value ?? 0
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
	return segmentTemplate.$.media.replace(regex, (match: any) => {
		// TODO: This may have a better way to do it for all the cases
		if (match === '$RepresentationID$') {
			return representation.$.id;
		}
		console.log(
			`Unknown property ${match} from the SegmentTemplate on representation ${representation.$.id}`,
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

function mapMpdToHam(mpd: MPDManifest): Presentation[] {
	return mpd.MPD.Period.map((period: Period) => {
		const duration: number = iso8601DurationToNumber(period.$.duration);
		const presentationId: string = 'presentation-id'; // todo: handle id

		const selectionSetGroups: { [group: string]: SelectionSet } = {};

		period.AdaptationSet.map((adaptationSet: AdaptationSet) => {
			const tracks: Track[] = adaptationSet.Representation.map(
				(representation: Representation) => {
					const segmentTemplate: SegmentTemplate | undefined =
						adaptationSet.SegmentTemplate?.at(0);
					const segments: Segment[] = mpdSegmentsToHamSegments(
						representation,
						duration,
						segmentTemplate,
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

		const selectionSets: SelectionSet[] = Object.values(selectionSetGroups);

		return { id: presentationId, selectionSets } as Presentation;
	});
}

export { mapMpdToHam };
