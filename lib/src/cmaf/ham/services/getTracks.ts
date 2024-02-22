import { Presentation, SelectionSet, SwitchingSet, Track } from '../types/model/index.js';

function getTracksFromSwitchingSet(switchingSet: SwitchingSet, predicate?: (track: Track) => boolean): Track[] {
	const tracks = switchingSet.tracks;
	return (predicate) ? tracks.filter(predicate) : tracks;
}

function getTracksFromSelectionSet(selectionSet: SelectionSet, predicate?: (track: Track) => boolean): Track[] {
	const tracks = selectionSet.switchingSets.flatMap(switchingSet =>
		getTracksFromSwitchingSet(switchingSet),
	);
	return (predicate) ? tracks.filter(predicate) : tracks;
}

function getTracksFromPresentation(presentation: Presentation, predicate?: (track: Track) => boolean): Track[] {
	const tracks = presentation.selectionSets.flatMap(selectionSet =>
		getTracksFromSelectionSet(selectionSet),
	);
	return (predicate) ? tracks.filter(predicate) : tracks;
}

export { getTracksFromPresentation, getTracksFromSelectionSet, getTracksFromSwitchingSet };
