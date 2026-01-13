import type { Segment } from '../../../../types/model/Segment.ts'

import {
	WHITE_SPACE,
	WHITE_SPACE_ENCODED,
} from '../../../../utils/constants.ts'
import { byteRangeToHlsString } from '../../../../utils/byteRange.ts'

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
			const byteRangeStr: string = segment.byteRange
				? `#EXT-X-BYTERANGE:${byteRangeToHlsString(segment.byteRange)}\n`
				: ''
			const url: string = segment.url.replaceAll(
				WHITE_SPACE,
				WHITE_SPACE_ENCODED,
			)
			return `#EXTINF:${segment.duration},\n${byteRangeStr}\n${url}`
		})
		.join('\n')
}
