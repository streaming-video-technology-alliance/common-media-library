import { deepStrictEqual } from 'node:assert';
import { beforeEach, describe, it } from 'node:test';

import {
	getTracksFromSelectionSet,
	SelectionSet,
	validateTracks,
	Presentation,
} from '@svta/common-media-library';

import jsonHam0 from './data/ham-samples/fromDash/ham0.json' assert { type: 'json' };

describe('ham validation', () => {
	let selectionSet: SelectionSet;
	beforeEach(() => {
		selectionSet = (jsonHam0 as Presentation[])[0].selectionSets[0];
	});

	it('returns true when track list is empty', () => {
		const valid = validateTracks([]);
		deepStrictEqual(valid, {
			status: true,
			errorMessages: [],
		});
	});

	it('returns true when all tracks are valid', () => {
		// Fixme: valid is undefined
		const valid = validateTracks(getTracksFromSelectionSet(selectionSet));
		deepStrictEqual(valid, {
			status: true,
			errorMessages: [],
		});
	});

	it('returns false when at least one track has different duration', () => {
		const originalDuration =
			selectionSet.switchingSets[0].tracks[1].duration;
		selectionSet.switchingSets[0].tracks[1].duration = 1;

		const valid = validateTracks(getTracksFromSelectionSet(selectionSet));
		selectionSet.switchingSets[0].tracks[1].duration = originalDuration;
		deepStrictEqual(valid, {
			status: false,
			errorMessages: ['All the tracks must have the same duration.'],
		});
	});

	it.skip('returns false when at least one track has no segments', () => {
		// FIXME: For some reason the changes in the object are affecting other tests
		const originalSegments =
			selectionSet.switchingSets[0].tracks[1].segments;
		selectionSet.switchingSets[0].tracks[1].segments = [];

		const valid = validateTracks(getTracksFromSelectionSet(selectionSet));
		selectionSet.switchingSets[0].tracks[1].segments = originalSegments;
		deepStrictEqual(valid, {
			status: false,
			description: { sameDuration: true, atLeastOneSegment: false },
			tracksWithErrors: ['video_eng=759000'],
		});
	});
});
