import { SelectionSet, validateTracks, getTracksFromSelectionSet } from '@svta/common-media-library';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';
import jsonSwitchingSet1 from './data/selectionSet1.json' assert { type: 'json' };

describe('ham validation', () => {

	it('returns true when all tracks are valid', () => {
		const switchingSet = jsonSwitchingSet1 as unknown as SelectionSet;

		const valid = validateTracks(getTracksFromSelectionSet(switchingSet));
		equal(valid, true);
	});

	it('returns false when at least one track is not valid', () => {
		const selectionSet = jsonSwitchingSet1 as unknown as SelectionSet;
		selectionSet.switchingSets[0].tracks[1].duration = 1;

		const valid = validateTracks(getTracksFromSelectionSet(selectionSet));
		equal(valid, false);
	});
});
