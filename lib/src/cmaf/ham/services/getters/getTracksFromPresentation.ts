import type { Presentation } from '../../types/model/Presentation';
import type { Track } from '../../types/model/Track';

import { getTracksFromSelectionSet } from './getTracksFromSelectionSet.ts';

/**
 * Get a list of Tracks contained on a Presentation
 *
 * @param presentation - Presentation object from HAM
 * @param predicate - Filtering function
 * @returns Track[]
 *
 * @group CMAF
 * @alpha
 */
export function getTracksFromPresentation(
	presentation: Presentation,
	predicate?: (track: Track) => boolean,
): Track[] {
	const tracks = presentation.selectionSets.flatMap((selectionSet) =>
		getTracksFromSelectionSet(selectionSet),
	);
	return predicate ? tracks.filter(predicate) : tracks;
}
