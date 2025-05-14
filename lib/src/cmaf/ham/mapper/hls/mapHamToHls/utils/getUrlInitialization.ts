import type { AudioTrack } from '../../../../types/model/AudioTrack';
import type { VideoTrack } from '../../../../types/model/VideoTrack';

import {
	WHITE_SPACE,
	WHITE_SPACE_ENCODED,
} from '../../../../utils/constants.ts';

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
export function getUrlInitialization(track: VideoTrack | AudioTrack): string {
	return (
		track.urlInitialization?.replaceAll(WHITE_SPACE, WHITE_SPACE_ENCODED) ??
		''
	);
}
