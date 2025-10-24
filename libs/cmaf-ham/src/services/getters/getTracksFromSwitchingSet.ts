import type { SwitchingSet } from '../../types/model/SwitchingSet.ts'
import type { Track } from '../../types/model/Track.ts'

/**
 * Get a list of Tracks contained on a SwitchingSet
 *
 * @param switchingSet - SwitchingSet object from HAM
 * @param predicate - Filtering function
 * @returns Track[]
 *
 * @alpha
 */
export function getTracksFromSwitchingSet(
	switchingSet: SwitchingSet,
	predicate?: (track: Track) => boolean,
): Track[] {
	const tracks = switchingSet.tracks
	return predicate ? tracks.filter(predicate) : tracks
}
