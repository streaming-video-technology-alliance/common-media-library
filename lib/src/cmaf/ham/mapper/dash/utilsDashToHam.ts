import type {
	AdaptationSet,
	Period,
	Representation,
	SegmentTemplate,
} from '../../types';
import { Segment } from '../../types/model/index.js';

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
	if (adaptationSet.$.mimeType || representation?.$.mimeType) {
		const type =
			adaptationSet.$.mimeType?.split('/')[0] ||
			representation?.$.mimeType?.split('/')[0];
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

/**
 * Calculates the duration of a segment
 *
 * segmentDuration = duration / timescale
 *
 * @param duration
 * @param timescale
 * @returns Segment duration
 */
function calculateDuration(
	duration: string | undefined,
	timescale: string | undefined,
): number {
	if (!duration || !timescale) {
		return 1;
	}
	return +(duration ?? 1) / +(timescale ?? 1);
}

function getFrameRate(
	adaptationSet: AdaptationSet,
	representation: Representation,
): string {
	const frameRate: string =
		representation.$.frameRate ?? adaptationSet.$.frameRate ?? '';
	if (!frameRate) {
		console.error(
			`Representation ${representation.$.id} has no frame rate`,
		);
	}
	return frameRate;
}

function getGroup(adaptationSet: AdaptationSet): string {
	return adaptationSet.$.group ?? getContentType(adaptationSet);
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

/**
 * Calculates the number of segments that a track has to use SegmentTemplate.
 *
 * Equation used:
 * segments = total duration / (segment duration / timescale)
 * **This equation might be wrong, please double-check it**
 *
 * @param segmentTemplate
 * @param duration
 * @returns Number of segments
 */
function getNumberOfSegments(
	segmentTemplate: SegmentTemplate,
	duration: number,
): number {
	// FIXME: This equation may be wrong
	return Math.round(
		duration /
			calculateDuration(
				segmentTemplate.$.duration,
				segmentTemplate.$.timescale,
			),
	);
}

function getPresentationId(period: Period, duration: number): string {
	return period.$.id ?? `presentation-id-${duration}`;
}

function getSampleRate(
	adaptationSet: AdaptationSet,
	representation: Representation,
): number {
	const sampleRate: number = +(
		representation.$.audioSamplingRate ??
		adaptationSet.$.audioSamplingRate ??
		0
	);
	if (!sampleRate) {
		console.error(
			`Representation ${representation.$.id} has no audioSamplingRate`,
		);
	}
	return sampleRate;
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

/**
 * Get the duration from a track.
 *
 * This is calculated using the sum of the duration of all the segments from the
 * track.
 *
 * An alternative to this could be number of segments * duration of a segment.
 *
 * @param segments
 * @returns Duration of the track
 */
function getTrackDuration(segments: Segment[]): number {
	return segments.reduce((acc: number, segment: Segment) => {
		return acc + segment.duration;
	}, 0);
}

function getUrlFromTemplate(
	representation: Representation,
	segmentTemplate: SegmentTemplate,
	segmentId: number,
): string {
	const regexTemplate = /\$(.*?)\$/g;
	return segmentTemplate.$.media.replace(regexTemplate, (match: any) => {
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

export {
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
};
