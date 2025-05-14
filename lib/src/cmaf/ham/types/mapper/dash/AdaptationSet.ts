import type { AudioChannelConfiguration } from './AudioChannelConfiguration';
import type { ContentComponent } from './ContentComponent';
import type { Representation } from './Representation';
import type { Role } from './Role';
import type { SegmentList } from './SegmentList';
import type { SegmentTemplate } from './SegmentTemplate';

/**
 * DASH Adaptation Set
 *
 * @group CMAF
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
