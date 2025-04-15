import type { Byterange } from './Byterange.ts';

/**
 * HLS Segments
 *
 * @group CMAF
 * @alpha
 */
export type SegmentHls = {
	title?: string;
	duration: number;
	byterange?: Byterange;
	uri?: string;
	timeline?: number;
	map?: {
		uri: string;
		byterange: Byterange;
	};
};
