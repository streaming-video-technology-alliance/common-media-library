import { SwitchingSet, validateTracks, getTracksFromSwitchingSet } from '@svta/common-media-library';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';
import { switchingSet1 } from './data/switchingSet1.js';

describe('ham validation', () => {

	it('returns true when all tracks are valid', () => {
		const switchingSet = switchingSet1 as unknown as SwitchingSet;

		const valid = validateTracks(getTracksFromSwitchingSet(switchingSet));
		equal(valid, true);
	});

	it('returns false when at least one track is not valid', () => {
		const switchingSet = switchingSet1 as unknown as SwitchingSet;
		switchingSet.tracks[1].duration = 1;

		const valid = validateTracks(getTracksFromSwitchingSet(switchingSet));
		equal(valid, false);
	});
});

describe('deserialize ham', () => {

	it('deserializes track object', () => {

	});
});
