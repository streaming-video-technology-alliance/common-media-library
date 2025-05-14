import type { MediaGroups } from './MediaGroups';
import type { PlayList } from './Playlist';
import type { SegmentHls } from './SegmentHls';

/**
 * HLS manifest
 *
 * @group CMAF
 * @alpha
 */
export type HlsManifest = {
	playlists: PlayList[];
	mediaGroups: MediaGroups;
	segments: SegmentHls[];
	targetDuration?: number;
};
