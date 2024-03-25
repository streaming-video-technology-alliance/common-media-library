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
	SUBTITLES: {
		[key: string]: {
			[key: string]: {
				language: string;
			};
		};
	};
};

type Byterange = { length: number; offset: number };

/**
 * HLS Segments
 *
 * @group CMAF
 *
 * @alpha
 */
type SegmentHls = {
	title?: string;
	duration: number;
	byterange?: Byterange;
	url?: string;
	timeline?: number;
	map?: {
		uri: string;
		byterange: Byterange;
	};
};

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

export type { Byterange, PlayList, MediaGroups, SegmentHls, HlsManifest };
