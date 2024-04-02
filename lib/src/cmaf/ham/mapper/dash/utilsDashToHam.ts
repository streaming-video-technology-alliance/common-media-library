import type {
	AdaptationSet,
	Period,
	Representation,
	SegmentTemplate,
} from '../../types';
import { FrameRate, Segment } from '../../types/model';
import {
	DENOMINATOR,
	FRAME_RATE_NUMERATOR_30,
	FRAME_RATE_SEPARATOR,
	NUMERATOR,
	ZERO,
} from '../../../utils/constants.js';

/**
 * @internal
 *
 * Get the channels value (audio). It can be present on adaptationSet or representation.
 *
 * @param adaptationSet - AdaptationSet to try to get the channels from
 * @param representation - Representation to try to get the channels from
 * @returns Channels value
 */
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

/**
 * @internal
 *
 * Get the codec value (video and audio). It can be present on adaptationSet or representation.
 *
 * @param adaptationSet - AdaptationSet to try to get the codec from
 * @param representation - Representation to try to get the codec from
 * @returns Content codec
 */
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

/**
 * @internal
 *
 * Get the type of the content. It can be obtained directly from AdaptationSet/Representation
 * or can be inferred with the existing properties.
 *
 * @param adaptationSet - AdaptationSet to get the type from
 * @param representation - Representation to get the type from
 * @returns type of the content
 */
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
 * @internal
 *
 * Calculates the duration of a segment
 *
 * segmentDuration = duration / timescale
 *
 * @param duration - Duration of the segment
 * @param timescale - Timescale of the segment
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

/**
 * @internal
 *
 * Get the frame rate from a dash manifest.
 *
 * This functions assumes the adaptationSet and representation set are type video
 *
 * @param adaptationSet - To try to get the frameRate from
 * @param representation - To try to get the frameRate from
 * @returns object containing numerator and denominator
 */
function getFrameRate(
	adaptationSet: AdaptationSet,
	representation: Representation,
): FrameRate {
	const frameRateDash: string =
		representation.$.frameRate ?? adaptationSet.$.frameRate ?? '';
	if (!frameRateDash) {
		console.error(
			`Representation ${representation.$.id} has no frame rate`,
		);
	}
	const frameRate = frameRateDash.split(FRAME_RATE_SEPARATOR);
	const frameRateNumerator = parseInt(frameRate.at(NUMERATOR) ?? '');
	const frameRateDenominator = parseInt(frameRate.at(DENOMINATOR) ?? '');

	return {
		frameRateNumerator: isNaN(frameRateNumerator)
			? FRAME_RATE_NUMERATOR_30
			: frameRateNumerator,
		frameRateDenominator: isNaN(frameRateDenominator)
			? ZERO
			: frameRateDenominator,
	} as FrameRate;
}

function getGroup(adaptationSet: AdaptationSet): string {
	return adaptationSet.$.group ?? getContentType(adaptationSet);
}

/**
 * @internal
 *
 * Get the initialization url. It can be present on AdaptationSet or Representation.
 *
 * Url initialization is present on segments.
 *
 * @param adaptationSet - AdaptationSet to try to get the initialization url from
 * @param representation - Representation to try to get the initialization url from
 */
function getInitializationUrl(
	adaptationSet: AdaptationSet,
	representation: Representation,
): string | undefined {
	let initializationUrl: string | undefined;
	if (representation.SegmentBase) {
		initializationUrl = representation.BaseURL![0] ?? '';
	} else if (adaptationSet.SegmentList || representation.SegmentList) {
		initializationUrl =
			representation.SegmentList?.at(0)?.Initialization[0].$.sourceURL ||
			adaptationSet.SegmentList?.at(0)?.Initialization[0].$.sourceURL;
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

/**
 * @internal
 *
 * Get the language from an adaptation set.
 *
 * @param adaptationSet - AdaptationSet to get the language from
 * @returns language of the content
 */
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
 * @internal
 *
 * Calculates the number of segments that a track has to use SegmentTemplate.
 *
 * Equation used:
 * segments = total duration / (segment duration / timescale)
 * **This equation might be wrong, please double-check it**
 *
 * @param segmentTemplate - SegmentTemplate object
 * @param duration - Total duration of the content
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

/**
 * @internal
 *
 * Generates a presentation id. It uses the period id as default or creates one
 * if none is present.
 *
 * @param period - Period to try to get the id from
 * @param duration - Duration of the content
 * @returns Presentation id
 */
function getPresentationId(period: Period, duration: number): string {
	return period.$.id ?? `presentation-id-${duration}`;
}

/**
 * @internal
 *
 * Get sample rate (audio)
 *
 * @param adaptationSet - AdaptationSet to try to get the sampleRate from
 * @param representation - Representation to try to get the sampleRate from
 * @returns Sample rate. In case it is not presents, it returns 0.
 */
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

/**
 * @internal
 *
 * Get the sar value. It can be present on adaptationSet or representation.
 *
 * @param adaptationSet - AdaptationSet to try to get the sar from
 * @param representation - AdaptationSet to try to get the sar from
 * @returns sar value. In case it is not present, returns empty string.
 */
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
 * @internal
 *
 * Calculate the duration of a track.
 *
 * This is calculated using the sum of the duration of all the segments from the
 * track.
 *
 * An alternative to this could be number of segments * duration of a segment.
 *
 * @param segments - Segments to calculate the sum of the durations
 * @returns Duration of the track
 */
function getTrackDuration(segments: Segment[]): number {
	return segments.reduce((acc: number, segment: Segment) => {
		return acc + segment.duration;
	}, 0);
}

/**
 * @internal
 *
 * Create the url from a segment template.
 *
 * Searches for substrings with the format `$value$` and replaces it with the correct value.
 * - RepresentationID: id of the representation.
 * - Number: id of the segment. `%0Xd` defines the number `X` of digits it needs to have.
 *
 * @param representation - Representation of the template
 * @param segmentTemplate - Segment template
 * @param segmentId - Segment id
 * @returns url from the segment template
 */
function getUrlFromTemplate(
	representation: Representation,
	segmentTemplate: SegmentTemplate,
	segmentId: number,
): string {
	const regexTemplate = /\$(.*?)\$/g;
	return segmentTemplate.$.media.replace(regexTemplate, (match: any) => {
		if (match.includes('RepresentationID')) {
			return representation.$.id;
		}
		/**
		 * Number with 4 digits e.g: 0001
		 */
		if (match.includes('Number%04d')) {
			return segmentId.toString().padStart(4, '0');
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
	getInitializationUrl,
	getLanguage,
	getNumberOfSegments,
	getPresentationId,
	getSampleRate,
	getSar,
	getTrackDuration,
	getUrlFromTemplate,
};
