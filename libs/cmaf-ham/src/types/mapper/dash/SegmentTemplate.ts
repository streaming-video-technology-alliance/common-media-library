/**
 * DASH Segment template
 *
 * It is used as a template to create the actual templates
 *
 * @alpha
 */
export type SegmentTemplate = {
	$: {
		duration: string;
		initialization: string;
		media: string;
		startNumber: string;
		timescale: string;
	};
};
