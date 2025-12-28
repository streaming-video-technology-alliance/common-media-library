/**
 * ISO/IEC 14496-30:2014 - WebVTT Source Label Box
 *
 * @public
 */
export type WebVttSourceLabelBox = {
	type: 'vlab';
	sourceLabel: string;
};

/**
 * @public
 */
export type vlab = WebVttSourceLabelBox;
