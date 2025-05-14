import type { AudioTrack } from '../../../../types/model/AudioTrack';
import type { VideoTrack } from '../../../../types/model/VideoTrack';

import { getByterange } from './getByterange.ts';
import { getUrlInitialization } from './getUrlInitialization.ts';

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
export function getPlaylistData(track: AudioTrack | VideoTrack): string {
	return `#EXT-X-MAP:URI="${getUrlInitialization(track)}",${getByterange(track)}\n`;
}
