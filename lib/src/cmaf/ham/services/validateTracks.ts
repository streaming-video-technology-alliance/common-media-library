import type { Track } from '../types/model/index.js';

function validateTracks(tracks: Track[]): boolean {
	if (!tracks.length) {
		return true;
	}
	let duration: number | undefined;
	let isValid = true;
	tracks.forEach(track => {
		if (!duration) {
			duration = track.duration;
		}
		if (track.duration !== duration) {
			isValid = false;
		}
	});
	return isValid;
}

export { validateTracks };