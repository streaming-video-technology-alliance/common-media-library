import type { Track } from '../../types/model/Track.ts'
import type { Validation } from '../../types/mapper/Validation.ts'

import { validateTrack } from './validateTrack.ts'

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
 * @alpha
 *
 */
export function validateTracks(
	tracks: Track[],
	switchingSetId?: string,
	prevValidation?: Validation,
): Validation {
	const validation: Validation = prevValidation ?? {
		status: true,
		errorMessages: [],
	}
	const moreInformation = switchingSetId
		? ` in the switching set with id = ${switchingSetId}`
		: '.'
	let tracksDuration: number

	tracks.forEach((track: Track) => {
		if (!tracksDuration) {
			tracksDuration = track.duration
		}
		if (tracksDuration !== track.duration) {
			validation.status = false
			validation.errorMessages.push(
				`All the tracks must have the same duration${moreInformation}`,
			)
		}
		validateTrack(track, switchingSetId, validation)
	})

	return validation
}
