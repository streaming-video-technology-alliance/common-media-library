import type { AudioTrack } from '../../types/model/AudioTrack.ts';
import type { TextTrack } from '../../types/model/TextTrack.ts';
import type { Track } from '../../types/model/Track.ts';
import type { VideoTrack } from '../../types/model/VideoTrack.ts';

import type { Validation } from '../../types/Validation.ts';

import { validateSegments } from './validateSegments.ts';

/**
 * Validate a track.
 * It validates in cascade, calling each child validation method.
 *
 * Validations:
 * - track has id
 * - Invokes specific audio, video and text validations
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
 * @alpha
 *
 */
export function validateTrack(
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
 * @internal
 *
 * Validate video Track
 *
 * Validations:
 * - track has codec
 *
 * @param videoTrack - Video track to validate
 * @param switchingSetId - Optional: id from the switching set containing the track (Only used for logs)
 * @param prevValidation - Optional: validation object from parent previous validate method call
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
 * @param switchingSetId - Optional: id from the switching set containing the track (Only used for logs)
 * @param prevValidation - Optional: validation object from parent previous validate method call
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
 * @param switchingSetId - Optional: id from the switching set containing the track (Only used for logs)
 * @param prevValidation - Optional: validation object from parent previous validate method call
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
