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
		audioSamplingRate?: string,
		mimeType?: string,
		codecs: string,
		startWithSAP?: string,
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
	Period: Period[],
}

export type { DashManifest, Period, AdaptationSet, Representation, SegmentMpd };
