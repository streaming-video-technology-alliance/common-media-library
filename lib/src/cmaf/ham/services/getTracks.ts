import type {
	Presentation,
	SelectionSet,
	SwitchingSet,
	Track,
} from '../types/model';

/**
 * Get a list of Tracks contained on a SwitchingSet
 *
 * @param switchingSet - SwitchingSet object from HAM
 * @param predicate - Filtering function
 *
 * @returns Track[]
 *
 * @group CMAF
 *
 * @alpha
 */
function getTracksFromSwitchingSet(
	switchingSet: SwitchingSet,
	predicate?: (track: Track) => boolean,
): Track[] {
	const tracks = switchingSet.tracks;
	return predicate ? tracks.filter(predicate) : tracks;
}

/**
 * Get a list of Tracks contained on a SelectionSet
 *
 * @param selectionSet - SelectionSet object from HAM
 * @param predicate - Filtering function
 *
 * @returns Track[]
 *
 * @group CMAF
 *
 * @alpha
 */
function getTracksFromSelectionSet(
	selectionSet: SelectionSet,
	predicate?: (track: Track) => boolean,
): Track[] {
	const tracks = selectionSet.switchingSets.flatMap((switchingSet) =>
		getTracksFromSwitchingSet(switchingSet),
	);
	return predicate ? tracks.filter(predicate) : tracks;
}

/**
 * Get a list of Tracks contained on a Presentation
 *
 * @param presentation - Presentation object from HAM
 * @param predicate - Filtering function
 *
 * @returns Track[]
 *
 * @group CMAF
 *
 * @alpha
 */
function getTracksFromPresentation(
	presentation: Presentation,
	predicate?: (track: Track) => boolean,
): Track[] {
	const tracks = presentation.selectionSets.flatMap((selectionSet) =>
		getTracksFromSelectionSet(selectionSet),
	);
	return predicate ? tracks.filter(predicate) : tracks;
}

export {
	getTracksFromPresentation,
	getTracksFromSelectionSet,
	getTracksFromSwitchingSet,
};
