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

type MediaGroups = {
	AUDIO: {
		[key: string]: {
			[key: string]: {
				language: string;
			};
		};
	};
};

type SegmentHls = {
	duration: number;
};

/**
 * HLS manifest
 *
 * @group CMAF
 *
 * @alpha
 */
type hls = {
	playlists: PlayList[];
	mediaGroups: MediaGroups;
	segments: SegmentHls[];
};

export type { PlayList, MediaGroups, SegmentHls, hls };
