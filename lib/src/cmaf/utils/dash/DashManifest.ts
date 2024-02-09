type SegmentMpd = {
	$: {
		timescale?: number,
		indexRangeExact?: boolean,
		indexRange: string | null,
	},
	Initialization: [
		{
			$: {
				range: string | null,
			}
		}
	]
}

type Representation = {
	$: {
		id: string,
		bandwidth: number,
	},
	BaseURL?: string[],
	SegmentBase: SegmentMpd[]
}

type AdaptationSet = {
	$: {
		id: string,
		group: string,
		contentType: string,
		lang: string,
		minBandwidth?: string,
		maxBandwidth?: string,
		segmentAlignment?: string,
		subsegmentAlignment?: string,
		subsegmentStartsWithSAP?: string,
		audioSamplingRate?: number,
		mimeType?: string,
		codecs: string,
		startWithSAP?: string,
		par?: string;
		sar?: string;
		maxWidth?: number;
		maxHeight?: number;

	},
	AudioChannelConfiguration?: any[],
	Role?: any[],
	Representation: Representation[],
}

type Period = {
	$: {
		duration: string,
	},
	AdaptationSet: AdaptationSet[],
}

type DashManifest = {
	MPD: {
		Period: Period[],
	}
}

export type { DashManifest, Period, AdaptationSet, Representation, SegmentMpd };
