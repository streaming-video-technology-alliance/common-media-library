import type { AudioTrack } from '../../../../types/model/AudioTrack.ts'
import type { VideoTrack } from '../../../../types/model/VideoTrack.ts'

/**
 * Get the byterange in hls format from ham track.
 *
 * @param track - Track to get the byterange from
 * @returns string containing the byterange in the hls format
 *
 * @alpha
 */
export function encodeByteRange(track: VideoTrack | AudioTrack): string {
	if (track.initialization?.byteRange) {
		// Track initialization byteRange is now an object {start, end}
		const initByteRange = track.initialization.byteRange
		return `BYTERANGE:${initByteRange.end - initByteRange.start + 1}@${initByteRange.start}\n`
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
