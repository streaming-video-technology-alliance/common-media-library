import type { MediaGroups } from './MediaGroups.ts'
import type { PlayList } from './Playlist.ts'
import type { SegmentHls } from './SegmentHls.ts'

/**
 * HLS manifest
 *
 * @alpha
 */
export type HlsManifest = {
	playlists: PlayList[];
	mediaGroups: MediaGroups;
	segments: SegmentHls[];
	targetDuration?: number;
};
