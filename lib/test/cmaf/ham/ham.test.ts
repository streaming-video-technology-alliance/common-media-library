import {
	SelectionSet,
	validateTracks,
	getTracksFromSelectionSet,
} from '@svta/common-media-library';
import { deepEqual } from 'node:assert';
import { describe, it, beforeEach } from 'node:test';
import jsonSelectionSet1 from './data/selectionSet1.json' assert { type: 'json' };

describe('ham validation', () => {
	let selectionSet: SelectionSet;
	beforeEach(() => {
		selectionSet = jsonSelectionSet1 as unknown as SelectionSet;
	});

	it('returns false track list is empty', () => {
		const valid = validateTracks([]);
		deepEqual(valid, {
			status: false,
			description: { sameDuration: false, atLeastOneSegment: false },
			tracksWithErrors: [],
		});
	});

	it('returns true when all tracks are valid', () => {
		const valid = validateTracks(getTracksFromSelectionSet(selectionSet));
		deepEqual(valid, {
			status: true,
			description: { sameDuration: true, atLeastOneSegment: true },
			tracksWithErrors: [],
		});
	});

	it('returns false when at least one track has different duration', () => {
		// FIXME: For some reason the changes in the object are affecting other tests
		const originalDuration =
			selectionSet.switchingSets[0].tracks[1].duration;
		selectionSet.switchingSets[0].tracks[1].duration = 1;

		const valid = validateTracks(getTracksFromSelectionSet(selectionSet));
		selectionSet.switchingSets[0].tracks[1].duration = originalDuration;
		deepEqual(valid, {
			status: false,
			description: { sameDuration: false, atLeastOneSegment: true },
			tracksWithErrors: [],
		});
	});

	it('returns false when at least one track has no segments', () => {
		// FIXME: For some reason the changes in the object are affecting other tests
		const originalSegments =
			selectionSet.switchingSets[0].tracks[1].segments;
		selectionSet.switchingSets[0].tracks[1].segments = [];

		const valid = validateTracks(getTracksFromSelectionSet(selectionSet));
		selectionSet.switchingSets[0].tracks[1].segments = originalSegments;
		deepEqual(valid, {
			status: false,
			description: { sameDuration: true, atLeastOneSegment: false },
			tracksWithErrors: ['video_eng=759000'],
		});
	});
});
