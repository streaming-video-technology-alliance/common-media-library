import type { SelectionSet } from '../../types/model/SelectionSet.ts'
import type { Track } from '../../types/model/Track.ts'

import { getTracksFromSwitchingSet } from './getTracksFromSwitchingSet.ts'

/**
 * Get a list of Tracks contained on a SelectionSet
 *
 * @param selectionSet - SelectionSet object from HAM
 * @param predicate - Filtering function
 * @returns Track[]
 *
 * @alpha
 */
export function getTracksFromSelectionSet(
	selectionSet: SelectionSet,
	predicate?: (track: Track) => boolean,
): Track[] {
	const tracks = selectionSet.switchingSets.flatMap((switchingSet) =>
		getTracksFromSwitchingSet(switchingSet),
	)
	return predicate ? tracks.filter(predicate) : tracks
}
