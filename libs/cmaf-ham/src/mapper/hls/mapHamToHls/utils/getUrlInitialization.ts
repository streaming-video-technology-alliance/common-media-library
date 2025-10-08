import type { AudioTrack } from '../../../../types/model/AudioTrack.js';
import type { VideoTrack } from '../../../../types/model/VideoTrack.js';

import {
	WHITE_SPACE,
	WHITE_SPACE_ENCODED,
} from '../../../../utils/constants.js';

/**
 * @internal
 *
 * Get url initialization from ham track.
 *
 * @param track - Track to get the url initialization from
 * @returns string containing the url initialization in the hls format
 *
 * @alpha
 */
export function getUrlInitialization(track: VideoTrack | AudioTrack): string {
	return (
		track.urlInitialization?.replaceAll(WHITE_SPACE, WHITE_SPACE_ENCODED) ??
		''
	);
}
