import { deepStrictEqual } from 'node:assert'
import { describe, it } from 'vite-plus/test'

import { mapSegmentBase, mapSegmentList, mapSegments, mapSegmentTemplate } from '@svta/cml-cmaf-ham'

import {
	duration,
	representationBase,
	representationList,
	representationTemplate,
	segmentTemplate,
} from './testData.ts'
import {
	expectedSegmentBase,
	expectedSegmentList,
	expectedSegmentTemplate,
} from './testExpected.ts'

describe('map segments', () => {
	describe('mapSegmentBase', () => {
		it('maps SegmentBase to Segment[]', () => {
			const res = mapSegmentBase(representationBase, duration)
			deepStrictEqual(res, expectedSegmentBase)
		})
	})

	describe('mapSegmentList', () => {
		it('maps SegmentList to Segment[]', () => {
			const res = mapSegmentList(representationList.SegmentList ?? [])
			deepStrictEqual(res, expectedSegmentList)
		})
	})

	describe('mapSegmentTemplate', () => {
		it('maps Representation and SegmentTemplate to Segments[]', () => {
			const res = mapSegmentTemplate(representationTemplate, duration, segmentTemplate)
			deepStrictEqual(res, expectedSegmentTemplate)
		})

		it('replaces Time with the start time of each segment in timescale units', () => {
			const timeTemplate = {
				$: { ...segmentTemplate.$, media: '$RepresentationID$/$Time$.m4s' },
			}
			const res = mapSegmentTemplate(representationTemplate, duration, timeTemplate)
			deepStrictEqual(
				res.map(segment => segment.url),
				['1/0.m4s', '1/96.m4s', '1/192.m4s'],
			)
		})
	})

	describe('mapSegments', () => {
		it('returns segments from SegmentBase', () => {
			const adaptationSet = {
				$: { segmentAlignment: '' },
				Representation: [representationBase],
			}
			const res = mapSegments(adaptationSet, representationBase, duration)
			deepStrictEqual(res, expectedSegmentBase)
		})

		it('returns segments from SegmentList', () => {
			const adaptationSet = {
				$: { segmentAlignment: '' },
				Representation: [representationList],
			}
			const res = mapSegments(adaptationSet, representationList, duration)
			deepStrictEqual(res, expectedSegmentList)
		})

		it('returns segments from SegmentTemplate', () => {
			const adaptationSet = {
				$: { segmentAlignment: '' },
				Representation: [representationTemplate],
				SegmentTemplate: [segmentTemplate],
			}
			const res = mapSegments(adaptationSet, representationTemplate, duration)
			deepStrictEqual(res, expectedSegmentTemplate)
		})
	})
})
