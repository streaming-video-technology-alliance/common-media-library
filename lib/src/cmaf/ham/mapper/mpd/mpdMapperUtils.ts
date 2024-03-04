import type {
	AdaptationSet,
	Period,
	Representation,
	SegmentTemplate,
} from '../../types/DashManifest';

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

function getDuration(representation: Representation): number {
	const duration: number = +(
		representation.SegmentList?.at(0)?.$.duration ??
		representation.SegmentTemplate?.at(0)?.$.duration ??
		0
	);
	console.error(`Representation ${representation.$.id} has no duration`);
	return duration;
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

function getName(
	adaptationSet: AdaptationSet,
	representation: Representation,
	type: string,
): string {
	return adaptationSet.$.mimeType ?? representation?.$.mimeType ?? type;
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

export {
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
};
