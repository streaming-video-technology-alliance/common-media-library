/**
 * CMAF-HAM Segment type
 *
 * @group CMAF
 *
 * @beta
 */
type Segment = {
	duration: number;
	url: string;
	byteRange: string;
};

export type { Segment };
