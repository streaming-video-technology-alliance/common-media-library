import type { Fields } from '../boxes/Fields.ts';
import type { WebVttEmptySampleBox } from '../boxes/WebVttEmptySampleBox.ts';

/**
 * Parse a WebVTT Empty Sample Box from an IsoView
 *
 * @returns A parsed WebVTT Empty Sample Box
 *
 *
 * @beta
 */
export function vtte(): Fields<WebVttEmptySampleBox> {
	// Nothing should happen here.
	return {};
};
