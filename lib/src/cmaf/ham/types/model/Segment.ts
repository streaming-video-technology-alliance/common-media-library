/**
 * CMAF-HAM Segment type
 *
 * @group CMAF
 * @alpha
 */
type Segment = {
	duration: number;
	url: string;
	byteRange?: string;
};

export type { Segment };
