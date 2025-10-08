import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'node:test';

import { mapSegmentBase } from '@svta/cml-cmaf-ham/mapper/dash/mapDashToHam/mapSegmentBase.js';
import { mapSegmentList } from '@svta/cml-cmaf-ham/mapper/dash/mapDashToHam/mapSegmentList.js';
import { mapSegments } from '@svta/cml-cmaf-ham/mapper/dash/mapDashToHam/mapSegments.js';
import { mapSegmentTemplate } from '@svta/cml-cmaf-ham/mapper/dash/mapDashToHam/mapSegmentTemplate.js';

import {
	duration,
	representationBase,
	representationList,
	representationTemplate,
	segmentTemplate,
} from './testData.ts';
import {
	expectedSegmentBase,
	expectedSegmentList,
	expectedSegmentTemplate,
} from './testExpected.ts';

describe('map segments', () => {
	describe('mapSegmentBase', () => {
		it('maps SegmentBase to Segment[]', () => {
			const res = mapSegmentBase(representationBase, duration);
			deepStrictEqual(res, expectedSegmentBase);
		});
	});

	describe('mapSegmentList', () => {
		it('maps SegmentList to Segment[]', () => {
			const res = mapSegmentList(representationList.SegmentList ?? []);
			deepStrictEqual(res, expectedSegmentList);
		});
	});

	describe('mapSegmentTemplate', () => {
		it('maps Representation and SegmentTemplate to Segments[]', () => {
			const res = mapSegmentTemplate(
				representationTemplate,
				duration,
				segmentTemplate,
			);
			deepStrictEqual(res, expectedSegmentTemplate);
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
			deepStrictEqual(res, expectedSegmentBase);
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
			deepStrictEqual(res, expectedSegmentList);
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
			deepStrictEqual(res, expectedSegmentTemplate);
		});
	});
});
