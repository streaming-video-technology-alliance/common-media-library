import { describe, it } from 'node:test';
import { deepEqual } from 'node:assert';
import {
	mapSegmentBase,
	mapSegmentList,
	mapSegments,
	mapSegmentTemplate,
} from '../ham/mapper/dash/mapDashToHam.js';
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
			const res = mapSegmentList(representationList.SegmentList);
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
			const adaptationSet = {
				$: { segmentAlignment: '' },
				Representation: [representationBase],
			};
			const res = mapSegments(
				adaptationSet,
				representationBase,
				duration,
			);
			deepEqual(res, expectedSegmentBase);
		});

		it('returns segments from SegmentList', () => {
			const adaptationSet = {
				$: { segmentAlignment: '' },
				Representation: [representationList],
			};
			const res = mapSegments(
				adaptationSet,
				representationList,
				duration,
			);
			deepEqual(res, expectedSegmentList);
		});

		it('returns segments from SegmentTemplate', () => {
			const adaptationSet = {
				$: { segmentAlignment: '' },
				Representation: [representationTemplate],
				SegmentTemplate: [segmentTemplate],
			};
			const res = mapSegments(
				adaptationSet,
				representationTemplate,
				duration,
			);
			deepEqual(res, expectedSegmentTemplate);
		});
	});
});
