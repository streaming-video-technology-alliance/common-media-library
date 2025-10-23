import type { Segment } from '../../../../types/model/Segment.ts'

import {
	AT_SEPARATOR,
	HYPHEN_MINUS_SEPARATOR,
	WHITE_SPACE,
	WHITE_SPACE_ENCODED,
} from '../../../../utils/constants.ts'

/**
 * Format the ham segments to hls.
 *
 * @param segments - Segments to be formatted
 * @returns string containing the segments in the hls format
 *
 * @alpha
 */
export function getSegments(segments: Segment[]): string {
	return segments
		.map((segment: Segment): string => {
			const byteRange: string = segment.byteRange
				? `#EXT-X-BYTERANGE:${segment.byteRange.replace(HYPHEN_MINUS_SEPARATOR, AT_SEPARATOR)}\n`
				: ''
			const url: string = segment.url.replaceAll(
				WHITE_SPACE,
				WHITE_SPACE_ENCODED,
			)
			return `#EXTINF:${segment.duration},\n${byteRange}\n${url}`
		})
		.join('\n')
}
