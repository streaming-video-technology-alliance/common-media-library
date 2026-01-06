import type { AudioTrack } from '../../../../types/model/AudioTrack.ts'
import type { VideoTrack } from '../../../../types/model/VideoTrack.ts'

import {
	AT_SEPARATOR,
	HYPHEN_MINUS_SEPARATOR,
} from '../../../../utils/constants.ts'

/**
 * Get the byterange in hls format from ham track.
 *
 * @param track - Track to get the byterange from
 * @returns string containing the byterange in the hls format
 *
 * @alpha
 */
export function encodeByteRange(track: VideoTrack | AudioTrack): string {
	if (track.byteRange) {
		// Track byteRange is still a string (will be migrated later)
		return `BYTERANGE:${track.byteRange.replace(HYPHEN_MINUS_SEPARATOR, AT_SEPARATOR)}\n`
	}
	else if (track.segments?.at(0)?.byteRange) {
		// Segment byteRange is now an object {start, end}
		const firstSegmentByteRange = track.segments.at(0)?.byteRange
		if (firstSegmentByteRange) {
			return `BYTERANGE:0@${firstSegmentByteRange.start - 1}\n`
		}
	}
	return ''
}
