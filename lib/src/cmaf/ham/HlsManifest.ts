export type PlayList = {
	uri: string;
	attributes: {
		AUDIO: string;
		LANGUAGE: string;
		CODECS: string;
		BANDWIDTH: number;
		RESOLUTION: {
			width: number;
			height: number;
		};
	};
};

export type MediaGroups = {
	AUDIO: {
		[key: string]: {
			[key: string]: {
				language: string;
			};
		};
	};
};

export type Segment = {
	duration: number;
	map: string;
};

export type m3u8 = {
	playlists: PlayList[];
	mediaGroups: MediaGroups;
	segments: Segment[];
};
