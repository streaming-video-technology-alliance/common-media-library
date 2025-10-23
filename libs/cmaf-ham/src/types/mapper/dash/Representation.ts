import type { AudioChannelConfiguration } from './AudioChannelConfiguration.ts'
import type { SegmentBase } from './SegmentBase.ts'
import type { SegmentList } from './SegmentList.ts'
import type { SegmentTemplate } from './SegmentTemplate.ts'

/**
 * DASH Representation
 *
 * @alpha
 */
export type Representation = {
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
