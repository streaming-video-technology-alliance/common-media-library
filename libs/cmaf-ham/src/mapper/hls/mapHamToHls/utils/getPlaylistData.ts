import type { AudioTrack } from '../../../../types/model/AudioTrack.ts';
import type { VideoTrack } from '../../../../types/model/VideoTrack.ts';

import { encodeByteRange } from './encodeByteRange.ts';
import { getUrlInitialization } from './getUrlInitialization.ts';

/**
 * @internal
 *
 * Get the playlist data in hls format from ham track.
 *
 * @param track - Track to get the playlist data from
 * @returns string containing the playlist data in the hls format
 *
 * @alpha
 */
export function getPlaylistData(track: AudioTrack | VideoTrack): string {
	return `#EXT-X-MAP:URI="${getUrlInitialization(track)}",${encodeByteRange(track)}\n`;
}
