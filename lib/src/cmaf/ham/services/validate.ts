import {
	AudioTrack,
	Presentation,
	SelectionSet,
	SwitchingSet,
	Track,
	VideoTrack,
	TextTrack,
	Segment,
} from '../types/model/index.js';

// TODO: Track and Segment validation are so simple for the PoC. The method should validate more deeper and connecting the things
// in the model like durations, urls, frame rate, etc.

/**
 * CMAF-HAM Validation type
 *
 * @group CMAF
 * @alpha
 */
type Validation = {
	status: boolean;
	errorMessages: string[];
};

/**
 * Validate a presentation.
 * It validates in cascade, calling each child validation method.
 *
 * Validations:
 * - Presentation has id
 *
 * @example
 * ```ts
 * import cmaf, { Presentation } from '@svta/common-media-library/cmaf-ham';
 * ...
 *
 * // const presentation: Presentation = ...;
 *
 * const validation = cmaf.validatePresentation(presentation);
 * ```
 *
 * Example output: `{ status: true|false, errorMessages: [...] }`
 *
 * @param presentation - Presentation from cmaf ham model
 * @returns Validation
 *
 * @group CMAF
 * @alpha
 *
 */
function validatePresentation(presentation: Presentation): Validation {
	const validation: Validation = { status: true, errorMessages: [] };

	if (!presentation.id) {
		validation.status = false;
		validation.errorMessages.push('Presentation id is undefined');
	}

	validateSelectionSets(
		presentation.selectionSets,
		presentation.id,
		validation,
	);

	return validation;
}

/**
 * Validate a list of selection set.
 * It validates in cascade, calling each child validation method.
 *
 * @example
 * ```ts
 * import cmaf, { SelectionSet } from '@svta/common-media-library/cmaf-ham';
 * ...
 *
 * // const selectionSets: SelectionSet[] = ...;
 *
 * const validation = cmaf.validateSelectionSets(selectionSets);
 * ```
 *
 * Example output: `{ status: true|false, errorMessages: [...] }`
 *
 * @param selectionSets - List of SelectionSet from cmaf ham model
 * @param presentationId - Optional: parent presentation id
 * @param prevValidation - Optional: validation object from parent previous validate method call
 * @returns Validation
 *
 * @group CMAF
 * @alpha
 *
 */
function validateSelectionSets(
	selectionSets: SelectionSet[],
	presentationId?: string,
	prevValidation?: Validation,
): Validation {
	const validation: Validation = prevValidation ?? {
		status: true,
		errorMessages: [],
	};

	selectionSets.forEach((selectionSet: SelectionSet) => {
		validateSelectionSet(selectionSet, presentationId, validation);
	});

	return validation;
}

/**
 * Validate a selection set.
 * It validates in cascade, calling each child validation method.
 *
 * Validations:
 * - SelectionSet has id
 *
 * @example
 * ```ts
 * import cmaf, { SelectionSet } from '@svta/common-media-library/cmaf-ham';
 * ...
 *
 * // const selectionSet: SelectionSet = ...;
 *
 * const validation = cmaf.validateSelectionSet(selectionSet);
 * ```
 *
 * Example output: `{ status: true|false, errorMessages: [...] }`
 *
 * @param selectionSet - SelectionSet from cmaf ham model
 * @param presentationId - Optional: parent presentation id
 * @param prevValidation - Optional: validation object from parent previous validate method call
 * @returns Validation
 *
 * @group CMAF
 * @alpha
 *
 */
function validateSelectionSet(
	selectionSet: SelectionSet,
	presentationId?: string,
	prevValidation?: Validation,
): Validation {
	const validation: Validation = prevValidation ?? {
		status: true,
		errorMessages: [],
	};
	const moreInformation = presentationId
		? ` in the presentation with id = ${presentationId}`
		: '.';

	if (!selectionSet.id) {
		validation.status = false;
		validation.errorMessages.push(
			`SelectionSet id is undefined${moreInformation}`,
		);
	}

	validateSwitchingSets(
		selectionSet.switchingSets,
		selectionSet.id,
		validation,
	);

	return validation;
}

/**
 * Validate a list of switching set.
 * It validates in cascade, calling each child validation method.
 *
 * @example
 * ```ts
 * import cmaf, { SwitchingSet } from '@svta/common-media-library/cmaf-ham';
 * ...
 *
 * // const switchingSets: SwitchingSet[] = ...;
 *
 * const validation = cmaf.validateSwitchingSets(switchingSets);
 * ```
 *
 * Example output: `{ status: true|false, errorMessages: [...] }`
 *
 * @param switchingSets - List of SwitchingSets from cmaf ham model
 * @param selectionSetId - Optional: parent selection set id
 * @param prevValidation - Optional: validation object from parent previous validate method call
 * @returns Validation
 *
 * @group CMAF
 * @alpha
 *
 */
function validateSwitchingSets(
	switchingSets: SwitchingSet[],
	selectionSetId?: string,
	prevValidation?: Validation,
): Validation {
	const validation: Validation = prevValidation ?? {
		status: true,
		errorMessages: [],
	};

	switchingSets.forEach((switchingSet: SwitchingSet) => {
		validateSwitchingSet(switchingSet, selectionSetId, validation);
	});

	return validation;
}

/**
 * Validate a switching set.
 * It validates in cascade, calling each child validation method.
 *
 * Validations:
 * - SwitchingSet has id
 *
 * @example
 * ```ts
 * import cmaf, { SwitchingSet } from '@svta/common-media-library/cmaf-ham';
 * ...
 *
 * // const switchingSet: SwitchingSet = ...;
 *
 * const validation = cmaf.validateSwitchingSet(switchingSet);
 * ```
 *
 * Example output: `{ status: true|false, errorMessages: [...] }`
 *
 * @param switchingSet - SwitchingSet from cmaf ham model
 * @param selectionSetId - Optional: parent selection set id
 * @param prevValidation - Optional: validation object from parent previous validate method call
 * @returns Validation
 *
 * @group CMAF
 * @alpha
 *
 */
function validateSwitchingSet(
	switchingSet: SwitchingSet,
	selectionSetId?: string,
	prevValidation?: Validation,
): Validation {
	const validation: Validation = prevValidation ?? {
		status: true,
		errorMessages: [],
	};
	const moreInformation = selectionSetId
		? ` in the selection set with id = ${selectionSetId}`
		: '.';

	if (!switchingSet.id) {
		validation.status = false;
		validation.errorMessages.push(
			`SwitchingSet id is undefined${moreInformation}`,
		);
	}

	validateTracks(switchingSet.tracks, switchingSet.id, validation);

	return validation;
}

/**
 * Validate a list of tracks.
 * It validates in cascade, calling each child validation method.
 *
 * @example
 * ```ts
 * import cmaf, { Track } from '@svta/common-media-library/cmaf-ham';
 * ...
 *
 * // const tracks: Track[] = ...;
 *
 * const validation = cmaf.validateTracks(tracks);
 * ```
 *
 * Example output: `{ status: true|false, errorMessages: [...] }`
 *
 * @param tracks - List of Track from cmaf ham model
 * @param switchingSetId - Optional: parent switching set id
 * @param prevValidation - Optional: validation object from parent previous validate method call
 * @returns Validation
 *
 * @group CMAF
 * @alpha
 *
 */
function validateTracks(
	tracks: Track[],
	switchingSetId?: string,
	prevValidation?: Validation,
): Validation {
	const validation: Validation = prevValidation ?? {
		status: true,
		errorMessages: [],
	};
	const moreInformation = switchingSetId
		? ` in the switching set with id = ${switchingSetId}`
		: '.';
	let tracksDuration: number;

	tracks.forEach((track: Track) => {
		if (!tracksDuration) {
			tracksDuration = track.duration;
		}
		if (tracksDuration !== track.duration) {
			validation.status = false;
			validation.errorMessages.push(
				`All the tracks must have the same duration${moreInformation}`,
			);
		}
		validateTrack(track, switchingSetId, validation);
	});

	return validation;
}

/**
 * Validate a track.
 * It validates in cascade, calling each child validation method.
 *
 * Validations:
 * - track has id
 * - calls specific audio, video and text validations
 *
 * @example
 * ```ts
 * import cmaf, { Track } from '@svta/common-media-library/cmaf-ham';
 * ...
 *
 * // const track: Track = ...;
 *
 * const validation = cmaf.validateTrack(track);
 * ```
 *
 * Example output: `{ status: true|false, errorMessages: [...] }`
 *
 * @param track - Track from cmaf ham model
 * @param switchingSetId - Optional: parent switching set id
 * @param prevValidation - Optional: validation object from parent previous validate method call
 * @returns Validation
 *
 * @group CMAF
 * @alpha
 *
 */
function validateTrack(
	track: Track,
	switchingSetId?: string,
	prevValidation?: Validation,
): Validation {
	const validation: Validation = prevValidation ?? {
		status: true,
		errorMessages: [],
	};
	const moreInformation = switchingSetId
		? ` in the switching set with id = ${switchingSetId}`
		: '.';

	if (!track.id) {
		validation.status = false;
		validation.errorMessages.push(
			`Track id is undefined${moreInformation}`,
		);
	}

	switch (track.type) {
		case 'video':
			_validateVideoTrack(
				track as VideoTrack,
				switchingSetId,
				validation,
			);
			break;
		case 'audio':
			_validateAudioTrack(
				track as AudioTrack,
				switchingSetId,
				validation,
			);
			break;
		case 'text':
			_validateTextTrack(track as TextTrack, switchingSetId, validation);
			break;
	}

	validateSegments(track.segments, track.id, validation);

	return validation;
}

/**
 * Validate a list of segments.
 *
 * @example
 * ```ts
 * import cmaf, { Segment } from '@svta/common-media-library/cmaf-ham';
 * ...
 *
 * // const segments: Segment[] = ...;
 *
 * const validation = cmaf.validateSegments(segments);
 * ```
 *
 * Example output: `{ status: true|false, errorMessages: [...] }`
 *
 * @param segments - List of Segment from cmaf ham model
 * @param trackId - Optional: parent track id
 * @param prevValidation - Optional: validation object from parent previous validate method call
 * @returns Validation
 *
 * @group CMAF
 * @alpha
 *
 */
function validateSegments(
	segments: Segment[],
	trackId?: string,
	prevValidation?: Validation,
): Validation {
	const validation: Validation = prevValidation ?? {
		status: true,
		errorMessages: [],
	};

	segments.forEach((segment: Segment) => {
		validateSegment(segment, trackId, validation);
	});

	return validation;
}

/**
 *
 * @internal
 *
 * Validate a segment.
 *
 * Validations:
 * - segment has duration
 * - segment has url
 *
 * @param segment - Segment from cmaf ham model
 * @param trackId - Optional: parent track id
 * @param prevValidation - Optional: validation object from parent previous validate method call
 * @returns Validation
 *
 * @group CMAF
 * @alpha
 *
 */
function validateSegment(
	segment: Segment,
	trackId?: string,
	prevValidation?: Validation,
): Validation {
	const validation: Validation = prevValidation ?? {
		status: true,
		errorMessages: [],
	};
	const moreInformation = trackId
		? ` in the track with id = ${trackId}`
		: '.';

	if (!segment.duration) {
		validation.status = false;
		validation.errorMessages.push(
			`Segment duration is undefined${moreInformation}`,
		);
	}

	if (!segment.url) {
		validation.status = false;
		validation.errorMessages.push(
			`Segment url is undefined${moreInformation}`,
		);
	}

	return validation;
}

/**
 * @internal
 *
 * Validate video Track
 *
 * Validations:
 * - track has codec
 *
 * @param videoTrack - Video track to validate
 * @param switchingSetId - id from the switching set containing the track. Only used for logs.
 * @param prevValidation -
 * @returns Validation object
 * @see Validation
 */
function _validateVideoTrack(
	videoTrack: VideoTrack,
	switchingSetId?: string,
	prevValidation?: Validation,
): Validation {
	const validation: Validation = prevValidation ?? {
		status: true,
		errorMessages: [],
	};
	const moreInformation = switchingSetId
		? ` in the switching set with id = ${switchingSetId}`
		: '.';

	if (!videoTrack.codec) {
		validation.status = false;
		validation.errorMessages.push(
			`VideoTrack with id: ${videoTrack.id} does not have codec${moreInformation}`,
		);
	}

	return validation;
}

/**
 * @internal
 *
 * Validate Audio Track
 *
 * Validations:
 * - track has codec
 *
 * @param audioTrack - Audio track to validate
 * @param switchingSetId - id from the switching set containing the track. Only used for logs.
 * @param prevValidation -
 * @returns Validation object
 * @see Validation
 */
function _validateAudioTrack(
	audioTrack: AudioTrack,
	switchingSetId?: string,
	prevValidation?: Validation,
): Validation {
	const validation: Validation = prevValidation ?? {
		status: true,
		errorMessages: [],
	};
	const moreInformation = switchingSetId
		? ` in the switching set with id = ${switchingSetId}`
		: '.';

	if (!audioTrack.codec) {
		validation.status = false;
		validation.errorMessages.push(
			`AudioTrack with id: ${audioTrack.id} does not have codec${moreInformation}`,
		);
	}

	return validation;
}

/**
 * @internal
 *
 * Validate Text Track
 *
 * Validations:
 * - track has language
 *
 * @param textTrack - Text track to validate
 * @param switchingSetId - id from the switching set containing the track. Only used for logs.
 * @param prevValidation -
 * @returns Validation object
 * @see Validation
 */
function _validateTextTrack(
	textTrack: TextTrack,
	switchingSetId?: string,
	prevValidation?: Validation,
): Validation {
	const validation: Validation = prevValidation ?? {
		status: true,
		errorMessages: [],
	};
	const moreInformation = switchingSetId
		? ` in the switching set with id = ${switchingSetId}`
		: '.';

	if (!textTrack.language) {
		validation.status = false;
		validation.errorMessages.push(
			`TextTrack with id: ${textTrack.id} does not have codec${moreInformation}`,
		);
	}

	return validation;
}

export {
	validatePresentation,
	validateSelectionSets,
	validateSelectionSet,
	validateSwitchingSets,
	validateSwitchingSet,
	validateTracks,
	validateTrack,
	validateSegments,
};
