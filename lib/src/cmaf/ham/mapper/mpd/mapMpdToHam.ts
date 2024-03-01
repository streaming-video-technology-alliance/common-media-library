import { iso8601DurationToNumber } from '../../../utils/utils.js';
import type {
	AdaptationSet,
	DashManifest,
	Period,
	Representation,
	SegmentTemplate,
} from '../../types/DashManifest';
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

function getContentType(
	adaptationSet: AdaptationSet,
	representation?: Representation,
): string {
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
	console.error(
		`Could not find contentType from adaptationSet ${adaptationRef}`,
	);
	console.info('Using "text" as default contentType');
	return 'text';
}

function getGroup(adaptationSet: AdaptationSet): string {
	return adaptationSet.$.group ?? getContentType(adaptationSet);
}

function getChannels(
	adaptationSet: AdaptationSet,
	representation: Representation,
): number {
	const channels: number = +(
		adaptationSet.AudioChannelConfiguration?.at(0)?.$.value ??
		representation.AudioChannelConfiguration?.at(0)?.$.value ??
		0
	);
	if (!channels) {
		console.error(`Representation ${representation.$.id} has no channels`);
	}
	return channels;
}

function getCodec(
	adaptationSet: AdaptationSet,
	representation: Representation,
): string {
	const codec = representation.$.codecs ?? adaptationSet.$.codecs ?? '';
	if (!codec) {
		console.error(`Representation ${representation.$.id} has no codecs`);
	}
	return codec;
}

function getFrameRate(
	adaptationSet: AdaptationSet,
	representation: Representation,
): number {
	const frameRate: number = +(
		representation.$.frameRate ??
		adaptationSet.$.frameRate ??
		0
	);
	if (!frameRate) {
		console.error(
			`Representation ${representation.$.id} has no frame rate`,
		);
	}
	return frameRate;
}

function getLanguage(adaptationSet: AdaptationSet): string {
	let language = adaptationSet.$.lang;
	if (!language) {
		console.info(
			`AdaptationSet ${adaptationSet.$.id} has no lang, using "und" as default`,
		);
		language = 'und';
	}
	return language;
}

function getSar(
	adaptationSet: AdaptationSet,
	representation: Representation,
): string {
	const sar: string = representation.$.sar ?? adaptationSet.$.sar ?? '';
	if (!sar) {
		console.error(`Representation ${representation.$.id} has no sar`);
	}
	return sar;
}

function getNumberOfSegments(
	segmentTemplate: SegmentTemplate,
	duration: number,
): number {
	// TODO: Double check the number of segments, this equation may be wrong
	// segments = total duration / (segment duration * timescale)
	return Math.round(
		(duration * +(segmentTemplate.$.timescale ?? 1)) /
			+(segmentTemplate.$.duration ?? 1),
	);
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
			bandwidth: +(representation.$.bandwidth ?? 0),
			codec: getCodec(adaptationSet, representation),
			duration,
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
			bandwidth: +(representation.$.bandwidth ?? 0),
			channels: getChannels(adaptationSet, representation),
			codec: getCodec(adaptationSet, representation),
			duration,
			id: representation.$.id ?? '',
			language: getLanguage(adaptationSet),
			sampleRate: +(adaptationSet.$.audioSamplingRate ?? 0),
			segments,
			type,
		} as AudioTrack;
	} else {
		// if (type === 'text')
		return {
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

function getUrlFromTemplate(
	representation: Representation,
	segmentTemplate: SegmentTemplate,
	segmentId: number,
): string {
	const regexTemplate = /\$(.*?)\$/g;
	return segmentTemplate.$.media.replace(regexTemplate, (match: any) => {
		// TODO: This may have a better way to do it for all the cases
		if (match === '$RepresentationID$') {
			return representation.$.id;
		}
		if (match.includes('Number')) {
			return segmentId;
		}
		console.error(
			`Unknown property ${match} from the SegmentTemplate on representation ${representation.$.id}`,
		);
		return match;
	});
}

function getSegments(
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
		const presentationId: string = `presentation-id-${duration}`; // todo: handle id

		const selectionSetGroups: { [group: string]: SelectionSet } = {};

		period.AdaptationSet.map((adaptationSet: AdaptationSet) => {
			const tracks: Track[] = adaptationSet.Representation.map(
				(representation: Representation) => {
					const segmentTemplate: SegmentTemplate | undefined =
						adaptationSet.SegmentTemplate?.at(0) ??
						representation.SegmentTemplate?.at(0);
					const segments: Segment[] = getSegments(
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
