/**
 * CMAF-HAM Segment type
 *
 * @alpha
 */
export type Segment = {
	duration: number;
	url: string;
	byteRange?: string;
};
