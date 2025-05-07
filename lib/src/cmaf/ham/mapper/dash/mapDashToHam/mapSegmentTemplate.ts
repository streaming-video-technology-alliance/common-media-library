import type { Representation } from '../../../types/mapper/dash/Representation.ts';
import type { SegmentTemplate } from '../../../types/mapper/dash/SegmentTemplate.ts';

import type { Segment } from '../../../types/model/Segment.ts';

import { calculateDuration } from './utils/calculateDuration.ts';
import { getNumberOfSegments } from './utils/getNumberOfSegments.ts';
import { getUrlFromTemplate } from './utils/getUrlFromTemplate.ts';

/**
 * @internal
 *
 * Maps SegmentTemplate from dash to Segment list from ham.
 *
 * @param representation - Representation to generate the urls
 * @param duration - Duration of the segments
 * @param segmentTemplate - SegmentTemplate to get the properties from
 * @returns list of ham segments
 */
export function mapSegmentTemplate(
	representation: Representation,
	duration: number,
	segmentTemplate: SegmentTemplate,
): Segment[] {
	const numberOfSegments: number = getNumberOfSegments(
		segmentTemplate,
		duration,
	);
	const init: number = +(segmentTemplate.$.startNumber ?? 0);
	const segments: Segment[] = [];
	for (let id = init; id < numberOfSegments + init; id++) {
		segments.push({
			duration: calculateDuration(
				segmentTemplate.$.duration,
				segmentTemplate.$.timescale,
			),
			url: getUrlFromTemplate(representation, segmentTemplate, id),
		} as Segment);
	}
	return segments;
}
