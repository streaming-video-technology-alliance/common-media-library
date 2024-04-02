/**
 * DASH Segment URL
 *
 * @group CMAF
 * @alpha
 */
type SegmentURL = {
	$: {
		media?: string;
	};
};

/**
 * DASH Initialization
 *
 * @group CMAF
 * @alpha
 */
type Initialization = {
	$: {
		range?: string;
		sourceURL?: string;
	};
};

/**
 * DASH Segment Base
 *
 * @group CMAF
 * @alpha
 */
type SegmentBase = {
	$: {
		indexRange: string;
		indexRangeExact: string;
		timescale: string;
	};
	Initialization: Initialization[];
};

/**
 * DASH Segment List
 *
 * @group CMAF
 * @alpha
 */
type SegmentList = {
	$: {
		duration: string;
		timescale: string;
	};
	Initialization: Initialization[];
	SegmentURL?: SegmentURL[];
};

/**
 * DASH Segment template
 *
 * It is used as a template to create the actual templates
 *
 * @group CMAF
 * @alpha
 */
type SegmentTemplate = {
	$: {
		duration: string;
		initialization: string;
		media: string;
		startNumber: string;
		timescale: string;
	};
};

/**
 * DASH Audio Channel Configuration
 *
 * @group CMAF
 * @alpha
 */
type AudioChannelConfiguration = {
	$: {
		schemeIdUri: string;
		value: string;
	};
};

/**
 * DASH Representation
 *
 * @group CMAF
 * @alpha
 */
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

/**
 * DASH Adaptation Set
 *
 * @group CMAF
 * @alpha
 */
type AdaptationSet = {
	$: {
		audioSamplingRate?: string;
		codecs?: string;
		contentType?: string;
		frameRate?: string;
		group?: string;
		id?: string;
		lang?: string;
		maxBandwidth?: string;
		maxFrameRate?: string;
		maxHeight?: string;
		maxWidth?: string;
		mimeType?: string;
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

/**
 * DASH Period
 *
 * @group CMAF
 * @alpha
 */
type Period = {
	$: {
		duration: string;
		id?: string;
		start?: string;
	};
	AdaptationSet: AdaptationSet[];
};

/**
 * Json representation of the DASH Manifest
 *
 * @group CMAF
 * @alpha
 */
type DashManifest = {
	MPD: {
		$?: {
			maxSegmentDuration?: string;
			mediaPresentationDuration?: string;
			minBufferTime?: string;
			profiles?: string;
			type?: string;
			xmlns?: string;
		};
		Period: Period[];
	};
};

export type {
	DashManifest,
	Period,
	AdaptationSet,
	AudioChannelConfiguration,
	Representation,
	SegmentURL,
	SegmentBase,
	SegmentList,
	SegmentTemplate,
};
