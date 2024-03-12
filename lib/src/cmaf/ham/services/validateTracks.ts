import type { Track } from '../types/model';

/**
 * CMAF-HAM Track Validity type
 *
 * @group CMAF
 *
 * @alpha
 */

type TrackValidity = {
	status: boolean;
	description: {
		sameDuration: boolean;
		atLeastOneSegment: boolean;
	};
	tracksWithErrors: string[];
};

/**
 * Validate a list of tracks
 *
 * @param tracks - List of tracks
 *
 * @returns TrackValidity
 *
 * @group CMAF
 *
 * @alpha
 */
function validateTracks(tracks: Track[]): TrackValidity {
	if (!tracks?.length) {
		return {
			status: false,
			description: {
				sameDuration: false,
				atLeastOneSegment: false,
			},
			tracksWithErrors: [],
		};
	}

	const description = {
		sameDuration: true,
		atLeastOneSegment: true,
	};
	const tracksWithErrors: string[] = [];

	let duration: number | undefined;
	tracks.forEach((track) => {
		// Validate same duration
		if (!duration) {
			duration = track.duration;
		}
		if (track.duration !== duration) {
			description.sameDuration = false;
		}
		// Validate one or more segments
		if (!track.segments?.length) {
			description.atLeastOneSegment = false;
			tracksWithErrors.push(track.id);
		}
	});

	return {
		status: description.sameDuration && description.atLeastOneSegment,
		description,
		tracksWithErrors,
	};
}

export { validateTracks };
