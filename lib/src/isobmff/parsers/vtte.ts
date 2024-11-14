/**
 * ISO/IEC 14496-30:2014 - WebVTT Empty Sample Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type WebVTTEmptySampleBox = object;

/**
 * Parse a WebVTT Empty Sample Box from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed WebVTT Empty Sample Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function vtte(): WebVTTEmptySampleBox {
	// Nothing should happen here.
	return {};
};
