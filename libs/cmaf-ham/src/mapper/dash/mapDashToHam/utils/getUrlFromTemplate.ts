import { processUriTemplate } from '@svta/cml-dash'

import type { Representation } from '../../../../types/mapper/dash/Representation.ts'
import type { SegmentTemplate } from '../../../../types/mapper/dash/SegmentTemplate.ts'

/**
 * @internal
 *
 * Create the url from a segment template.
 *
 * Resolves the `$RepresentationID$`, `$Number$`, `$Bandwidth$`, `$Time$`, and `$$`
 * identifiers of the `media` attribute, with the format tags of ISO/IEC 23009-1
 * section 5.3.9.4.4. An identifier without a value stays in the url.
 *
 * @param representation - Representation of the template
 * @param segmentTemplate - Segment template
 * @param segmentId - Segment number
 * @param time - Start time of the segment in timescale units, for `$Time$`
 * @returns url from the segment template
 */
export function getUrlFromTemplate(
	representation: Representation,
	segmentTemplate: SegmentTemplate,
	segmentId: number,
	time?: number,
): string {
	return processUriTemplate(
		segmentTemplate.$.media,
		representation.$.id,
		segmentId,
		undefined,
		+representation.$.bandwidth || undefined,
		time,
	)
}
