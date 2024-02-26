type Initialization = {
	$: {
		range: string,
	}
}

type SegmentMpd = {
	$: {
		timescale?: string,
		indexRangeExact?: string,
		indexRange: string,
	},
	Initialization: Initialization[],
}

type Representation = {
	$: {
		id: string,
		bandwidth: string,
		width?: string,
		height?: string,
		codecs?: string,
		scanType?: string,
	},
	BaseURL?: string[],
	SegmentBase: SegmentMpd[]
}

type AdaptationSet = {
	$: {
		id: string;
		group: string;
		contentType: string;
		lang: string;
		minBandwidth?: string;
		maxBandwidth?: string;
		segmentAlignment?: string;
		subsegmentAlignment?: string;
		subsegmentStartsWithSAP?: string;
		audioSamplingRate?: string;
		mimeType?: string;
		codecs: string;
		startWithSAP?: string;
		par?: string;
		sar?: string;
		maxWidth?: string;
		maxHeight?: string;

	},
	AudioChannelConfiguration?: {
		$: {
			schemeIdUri: string;
			value: string;
		}
	}[],
	Role?: any[],
	Representation: Representation[],
}

type Period = {
	$: {
		duration: string;
	};
	AdaptationSet: AdaptationSet[];
};

type DashManifest = {
	$?: {
		xmlns?: string;
		type?: string;
		mediaPresentationDuration?: string;
		minBufferTime?: string;
		profiles?: string;
	};
	MPD: {
		Period: Period[];
	};
};

export type { DashManifest, Period, AdaptationSet, Representation, SegmentMpd };
