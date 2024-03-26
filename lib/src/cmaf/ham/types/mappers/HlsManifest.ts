/**
 * HLS manifest
 *
 * @group CMAF
 *
 * @alpha
 */
type HlsManifest = {
	playlists: PlayList[];
	mediaGroups: MediaGroups;
	segments: SegmentHls[];
};

/**
 * HLS Playlist
 *
 * @group CMAF
 *
 * @alpha
 */
type PlayList = {
	uri: string;
	attributes: {
		FRAME_RATE: number;
		CODECS: string;
		BANDWIDTH: number;
		RESOLUTION: {
			width: number;
			height: number;
		};
	};
};

/**
 * HLS Media Groups
 *
 * @group CMAF
 *
 * @alpha
 */
type MediaGroups = {
	AUDIO: {
		[key: string]: {
			[key: string]: {
				language: string;
			};
		};
	};
};

/**
 * HLS Segments
 *
 * @group CMAF
 *
 * @alpha
 */
type SegmentHls = {
	duration: number;
};


export type { PlayList, MediaGroups, SegmentHls, HlsManifest };
