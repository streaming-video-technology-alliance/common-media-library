import { AudioTrack, Segment, VideoTrack } from '../../types/model';
import {
	AT_SEPARATOR,
	HYPHEN_MINUS_SEPARATOR,
	WHITE_SPACE,
	WHITE_SPACE_ENCODED,
} from '../../../utils/constants.js';

function getByterange(track: VideoTrack | AudioTrack): string {
	if (track.byteRange) {
		return `BYTERANGE:${track.byteRange.replace(HYPHEN_MINUS_SEPARATOR, AT_SEPARATOR)}\n`;
	} else if (track.segments?.at(0)?.byteRange) {
		return `BYTERANGE:0@${Number(track.segments.at(0)?.byteRange?.replace(HYPHEN_MINUS_SEPARATOR, AT_SEPARATOR).split(AT_SEPARATOR)[0]) - 1}\n`;
	}
	return '';
}

function getPlaylistData(track: AudioTrack | VideoTrack): string {
	return `#EXT-X-MAP:URI="${getUrlInitialization(track)}",${getByterange(track)}\n`;
}

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

function getUrlInitialization(track: VideoTrack | AudioTrack): string {
	return (
		track.urlInitialization?.replaceAll(WHITE_SPACE, WHITE_SPACE_ENCODED) ??
		''
	);
}

export { getByterange, getPlaylistData, getSegments, getUrlInitialization };
