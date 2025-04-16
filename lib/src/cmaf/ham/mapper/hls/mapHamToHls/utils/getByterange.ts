import type { AudioTrack } from '../../../../types/model/AudioTrack.ts';
import type { VideoTrack } from '../../../../types/model/VideoTrack.ts';

import {
	AT_SEPARATOR,
	HYPHEN_MINUS_SEPARATOR,
} from '../../../../utils/constants.ts';

/**
 * @internal
 *
 * Get the byterange in hls format from ham track.
 *
 * @param track - Track to get the byterange from
 * @returns string containing the byterange in the hls format
 *
 * @group CMAF
 * @alpha
 */
export function getByterange(track: VideoTrack | AudioTrack): string {
	if (track.byteRange) {
		return `BYTERANGE:${track.byteRange.replace(HYPHEN_MINUS_SEPARATOR, AT_SEPARATOR)}\n`;
	}
	else if (track.segments?.at(0)?.byteRange) {
		return `BYTERANGE:0@${Number(track.segments.at(0)?.byteRange?.replace(HYPHEN_MINUS_SEPARATOR, AT_SEPARATOR).split(AT_SEPARATOR)[0]) - 1}\n`;
	}
	return '';
}
