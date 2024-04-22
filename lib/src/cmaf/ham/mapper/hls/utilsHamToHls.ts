import { AudioTrack, Segment, VideoTrack } from '../../types/model/index.js';
import {
	AT_SEPARATOR,
	HYPHEN_MINUS_SEPARATOR,
	WHITE_SPACE,
	WHITE_SPACE_ENCODED,
} from '../../utils/constants.js';

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
function getByterange(track: VideoTrack | AudioTrack): string {
	if (track.byteRange) {
		return `BYTERANGE:${track.byteRange.replace(HYPHEN_MINUS_SEPARATOR, AT_SEPARATOR)}\n`;
	} else if (track.segments?.at(0)?.byteRange) {
		return `BYTERANGE:0@${Number(track.segments.at(0)?.byteRange?.replace(HYPHEN_MINUS_SEPARATOR, AT_SEPARATOR).split(AT_SEPARATOR)[0]) - 1}\n`;
	}
	return '';
}

/**
 * @internal
 *
 * Get the playlist data in hls format from ham track.
 *
 * @param track - Track to get the playlist data from
 * @returns string containing the playlist data in the hls format
 *
 * @group CMAF
 * @alpha
 */
function getPlaylistData(track: AudioTrack | VideoTrack): string {
	return `#EXT-X-MAP:URI="${getUrlInitialization(track)}",${getByterange(track)}\n`;
}

/**
 * @internal
 *
 * Format the ham segments to hls.
 *
 * @param segments - Segments to be formatted
 * @returns string containing the segments in the hls format
 *
 * @group CMAF
 * @alpha
 */
function getSegments(segments: Segment[]): string {
	return segments
		.map((segment: Segment): string => {
			const byteRange: string = segment.byteRange
				? `#EXT-X-BYTERANGE:${segment.byteRange.replace(HYPHEN_MINUS_SEPARATOR, AT_SEPARATOR)}\n`
				: '';
			const url: string = segment.url.replaceAll(
				WHITE_SPACE,
				WHITE_SPACE_ENCODED,
			);
			return `#EXTINF:${segment.duration},\n${byteRange}\n${url}`;
		})
		.join('\n');
}

/**
 * @internal
 *
 * Get url initialization from ham track.
 *
 * @param track - Track to get the url initialization from
 * @returns string containing the url initialization in the hls format
 *
 * @group CMAF
 * @alpha
 */
function getUrlInitialization(track: VideoTrack | AudioTrack): string {
	return (
		track.urlInitialization?.replaceAll(WHITE_SPACE, WHITE_SPACE_ENCODED) ??
		''
	);
}

export { getByterange, getPlaylistData, getSegments, getUrlInitialization };
