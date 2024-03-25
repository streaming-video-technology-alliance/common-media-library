import {
	AudioTrack,
	Presentation,
	SelectionSet,
	SwitchingSet,
	Track,
	VideoTrack,
	TextTrack,
	Segment,
} from '../types/model';

// TODO: Track and Segment validation are so simple for the PoC. The method should validate more deeper and connecting the things 
// in the model like durations, urls, frame rate, etc.

/**
 * CMAF-HAM Validation type
 *
 * @group CMAF
 *
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
 * @param presentation - Presentation from cmaf ham model
 *
 * @returns Validation
 *
 * @group CMAF
 *
 * @alpha
 *
 */
function validatePresentation(presentation: Presentation): Validation {
	const validation: Validation = { status: true, errorMessages: [] };

	if (!presentation.id) {
		validation.status = false;
		validation.errorMessages?.push('Presentation id is undefined');
	}

	const selectionSetsValidation = validateSelectionSets(
		presentation.selectionSets,
		presentation.id,
	);
	validation.status = validation.status && selectionSetsValidation.status;
	validation.errorMessages = validation.errorMessages.concat(
		selectionSetsValidation.errorMessages,
	);

	return validation;
}

/**
 * Validate a list of selection set.
 * It validates in cascade, calling each child validation method.
 *
 * @param selectionSets - List of SelectionSet from cmaf ham model
 * @param presentationId - Optional: parent presentation id
 *
 * @returns Validation
 *
 * @group CMAF
 *
 * @alpha
 *
 */
function validateSelectionSets(
	selectionSets: SelectionSet[],
	presentationId?: string,
): Validation {
	const validation: Validation = { status: true, errorMessages: [] };

	selectionSets.forEach((selectionSet: SelectionSet) => {
		const val = validateSelectionSet(selectionSet, presentationId);
		validation.status = validation.status && val.status;
		validation.errorMessages = validation.errorMessages.concat(
			val.errorMessages,
		);
	});

	return validation;
}

/**
 * Validate a selection set.
 * It validates in cascade, calling each child validation method.
 *
 * @param selectionSet - SelectionSet from cmaf ham model
 * @param presentationId - Optional: parent presentation id
 *
 * @returns Validation
 *
 * @group CMAF
 *
 * @alpha
 *
 */
function validateSelectionSet(
	selectionSet: SelectionSet,
	presentationId?: string,
): Validation {
	const validation: Validation = { status: true, errorMessages: [] };
	const moreInformation = presentationId
		? ` in the presentation with id = ${presentationId}`
		: '.';

	if (!selectionSet.id) {
		validation.status = false;
		validation.errorMessages?.push(
			`SelectionSet id is undefined${moreInformation}`,
		);
	}

	const switchingSetsValidation = validateSwitchingSets(
		selectionSet.switchingSets,
		selectionSet.id,
	);
	validation.status = validation.status && switchingSetsValidation.status;
	validation.errorMessages = validation.errorMessages.concat(
		switchingSetsValidation.errorMessages,
	);

	return validation;
}

/**
 * Validate a list of switching set.
 * It validates in cascade, calling each child validation method.
 *
 * @param switchingSets - List of SwitchingSets from cmaf ham model
 * @param selectionSetId - Optional: parent selection set id
 *
 * @returns Validation
 *
 * @group CMAF
 *
 * @alpha
 *
 */
function validateSwitchingSets(
	switchingSets: SwitchingSet[],
	selectionSetId?: string,
): Validation {
	const validation: Validation = { status: true, errorMessages: [] };

	switchingSets.forEach((switchingSet: SwitchingSet) => {
		const val = validateSwitchingSet(switchingSet, selectionSetId);
		validation.status = validation.status && val.status;
		validation.errorMessages = validation.errorMessages.concat(
			val.errorMessages,
		);
	});

	return validation;
}

/**
 * Validate a switching set.
 * It validates in cascade, calling each child validation method.
 *
 * @param switchingSet - SwitchingSet from cmaf ham model
 * @param selectionSetId - Optional: parent selection set id
 *
 * @returns Validation
 *
 * @group CMAF
 *
 * @alpha
 *
 */
function validateSwitchingSet(
	switchingSet: SwitchingSet,
	selectionSetId?: string,
): Validation {
	const validation: Validation = { status: true, errorMessages: [] };
	const moreInformation = selectionSetId
		? ` in the selection set with id = ${selectionSetId}`
		: '.';

	if (!switchingSet.id) {
		validation.status = false;
		validation.errorMessages?.push(
			`SwitchingSet id is undefined${moreInformation}`,
		);
	}

	const tracksValidation = validateTracks(
		switchingSet.tracks,
		switchingSet.id,
	);
	validation.status = validation.status && tracksValidation.status;
	validation.errorMessages = validation.errorMessages.concat(
		tracksValidation.errorMessages,
	);

	return validation;
}

/**
 * Validate a list of tracks.
 * It validates in cascade, calling each child validation method.
 *
 * @param tracks - List of Track from cmaf ham model
 * @param switchingSetId - Optional: parent switching set id
 *
 * @returns Validation
 *
 * @group CMAF
 *
 * @alpha
 *
 */
function validateTracks(tracks: Track[], switchingSetId?: string): Validation {
	const validation: Validation = { status: true, errorMessages: [] };
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
		const val = validateTrack(track, switchingSetId);
		validation.status = validation.status && val.status;
		validation.errorMessages = validation.errorMessages.concat(
			val.errorMessages,
		);
	});

	return validation;
}

/**
 * Validate a track.
 * It validates in cascade, calling each child validation method.
 *
 * @param track - Track from cmaf ham model
 * @param switchingSetId - Optional: parent switching set id
 *
 * @returns Validation
 *
 * @group CMAF
 *
 * @alpha
 *
 */
function validateTrack(track: Track, switchingSetId?: string): Validation {
	const validation: Validation = { status: true, errorMessages: [] };
	const moreInformation = switchingSetId
		? ` in the switching set with id = ${switchingSetId}`
		: '.';

	if (!track.id) {
		validation.status = false;
		validation.errorMessages?.push(
			`Track id is undefined${moreInformation}`,
		);
	}

	let val: Validation;
	switch (track.type) {
		case 'video':
			val = _validateVideoTrack(track as VideoTrack, switchingSetId);
			break;
		case 'audio':
			val = _validateAudioTrack(track as AudioTrack, switchingSetId);
			break;
		case 'text':
			val = _validateTextTrack(track as TextTrack, switchingSetId);
			break;
	}

	const segmentsValidation = validateSegments(track.segments, track.id);
	validation.status =
		validation.status && val.status && segmentsValidation.status;
	validation.errorMessages = validation.errorMessages.concat(
		val.errorMessages,
		segmentsValidation.errorMessages,
	);

	return validation;
}

/**
 * Validate a list of segments.
 *
 * @param segments - List of Segment from cmaf ham model
 * @param trackId - Optional: parent track id
 *
 * @returns Validation
 *
 * @group CMAF
 *
 * @alpha
 *
 */
function validateSegments(segments: Segment[], trackId?: string): Validation {
	const validation: Validation = { status: true, errorMessages: [] };

	segments.forEach((segment: Segment) => {
		const val = validateSegment(segment, trackId);
		validation.status = validation.status && val.status;
		validation.errorMessages = validation.errorMessages.concat(
			val.errorMessages,
		);
	});

	return validation;
}

/**
 * Validate a segment.
 *
 * @param segment - Segment from cmaf ham model
 * @param trackId - Optional: parent track id
 *
 * @returns Validation
 *
 * @group CMAF
 *
 * @alpha
 *
 */
function validateSegment(segment: Segment, trackId?: string): Validation {
	const validation: Validation = { status: true, errorMessages: [] };
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

function _validateVideoTrack(
	videoTrack: VideoTrack,
	switchingSetId?: string,
): Validation {
	const validation: Validation = { status: true, errorMessages: [] };
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

function _validateAudioTrack(
	audioTrack: AudioTrack,
	switchingSetId?: string,
): Validation {
	const validation: Validation = { status: true, errorMessages: [] };
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

function _validateTextTrack(
	textTrack: TextTrack,
	switchingSetId?: string,
): Validation {
	const validation: Validation = { status: true, errorMessages: [] };
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
