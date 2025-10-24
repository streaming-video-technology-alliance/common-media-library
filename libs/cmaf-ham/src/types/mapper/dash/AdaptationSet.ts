import type { AudioChannelConfiguration } from './AudioChannelConfiguration.ts'
import type { ContentComponent } from './ContentComponent.ts'
import type { Representation } from './Representation.ts'
import type { Role } from './Role.ts'
import type { SegmentList } from './SegmentList.ts'
import type { SegmentTemplate } from './SegmentTemplate.ts'

/**
 * DASH Adaptation Set
 *
 * @alpha
 */
export type AdaptationSet = {
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
