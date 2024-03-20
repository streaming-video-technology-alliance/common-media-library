import { describe, it } from 'node:test';
import { deepEqual } from 'node:assert';
import {
	mapSegmentBase,
	mapSegmentList,
	mapSegments,
	mapSegmentTemplate,
} from '../ham/mapper/mpd/mapMpdToHam.js';
import {
	duration,
	representationBase,
	representationList,
	representationTemplate,
	segmentTemplate,
} from './testData.js';
import {
	expectedSegmentBase,
	expectedSegmentList,
	expectedSegmentTemplate,
} from './testExpected.js';

describe('map segments', () => {
	describe('mapSegmentBase', () => {
		it('maps SegmentBase to Segment[]', () => {
			const res = mapSegmentBase(representationBase, duration);
			deepEqual(res, expectedSegmentBase);
		});
	});

	describe('mapSegmentList', () => {
		it('maps SegmentList to Segment[]', () => {
			const res = mapSegmentList(representationList);
			deepEqual(res, expectedSegmentList);
		});
	});

	describe('mapSegmentTemplate', () => {
		it('maps Representation and SegmentTemplate to Segments[]', () => {
			const res = mapSegmentTemplate(
				representationTemplate,
				duration,
				segmentTemplate,
			);
			deepEqual(res, expectedSegmentTemplate);
		});
	});

	describe('mapSegments', () => {
		it('returns segments from SegmentBase', () => {
			const res = mapSegments(representationBase, duration, undefined);
			deepEqual(res, expectedSegmentBase);
		});

		it('returns segments from SegmentList', () => {
			const res = mapSegments(representationList, duration, undefined);
			deepEqual(res, expectedSegmentList);
		});

		it('returns segments from SegmentTemplate', () => {
			const res = mapSegments(
				representationTemplate,
				duration,
				segmentTemplate,
			);
			deepEqual(res, expectedSegmentTemplate);
		});
	});
});
