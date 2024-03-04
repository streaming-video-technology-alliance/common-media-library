type SegmentURL = {
	$: {
		media?: string;
	};
};

type Initialization = {
	$: {
		range?: string;
		sourceURL?: string;
	};
};

type SegmentBase = {
	$: {
		indexRange: string;
		indexRangeExact: string;
		timescale: string;
	};
	Initialization: Initialization[];
};

type SegmentList = {
	$: {
		duration: string;
		timescale: string;
	};
	Initialization: Initialization[];
	SegmentURL?: SegmentURL[];
};

type SegmentTemplate = {
	$: {
		duration: string;
		initialization: string;
		media: string;
		startNumber: string;
		timescale: string;
	};
};

type AudioChannelConfiguration = {
	$: {
		schemeIdUri: string;
		value: string;
	};
};

type Representation = {
	$: {
		audioSamplingRate?: string;
		bandwidth: string;
		codecs?: string;
		frameRate?: string;
		height?: string;
		id: string;
		mimeType?: string;
		sar?: string;
		scanType?: string;
		startWithSAP?: string;
		width?: string;
	};
	AudioChannelConfiguration?: AudioChannelConfiguration[];
	BaseURL?: string[];
	SegmentBase?: SegmentBase[];
	SegmentList?: SegmentList[];
	SegmentTemplate?: SegmentTemplate[];
};

type ContentComponent = {
	$: {
		contentType: string;
		id: string;
	};
};

type Role = {
	$: {
		schemeIdUri: string;
		value: string;
	};
};

type AdaptationSet = {
	$: {
		audioSamplingRate?: string;
		codecs?: string;
		contentType?: string;
		group?: string;
		id?: string;
		lang?: string;
		maxBandwidth?: string;
		maxFrameRate?: string;
		maxHeight?: string;
		maxWidth?: string;
		mimeType?: string;
		frameRate?: string;
		minBandwidth?: string;
		par?: string;
		sar?: string;
		segmentAlignment: string;
		startWithSAP?: string;
		subsegmentAlignment?: string;
		subsegmentStartsWithSAP?: string;
	};
	AudioChannelConfiguration?: AudioChannelConfiguration[];
	ContentComponent?: ContentComponent[];
	Role?: Role[];
	Representation: Representation[];
	SegmentTemplate?: SegmentTemplate[];
	SegmentList?: SegmentList[];
};

type Period = {
	$: {
		duration: string;
		id?: string;
		start?: string;
	};
	AdaptationSet: AdaptationSet[];
};

type DashManifest = {
	MPD: {
		$?: {
			maxSegmentDuration?: string;
			mediaPresentationDuration: string;
			minBufferTime: string;
			profiles: string;
			type: string;
			xmlns: string;
		};
		Period: Period[];
	};
};

export type {
	DashManifest,
	Period,
	AdaptationSet,
	Representation,
	SegmentURL,
	SegmentBase,
	SegmentList,
	SegmentTemplate,
};
