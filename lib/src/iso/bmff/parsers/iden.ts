import type { IsoView } from '../IsoView.js';

/**
 * ISO/IEC 14496-30:2014 - WebVTT Cue Id Box.
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type WebVTTCueIdBox = {
	cueId: string;
};

/**
 * Parse a WebVTTCueIdBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed WebVTTCueIdBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function iden(view: IsoView): WebVTTCueIdBox {
	return {
		cueId: view.readUtf8(-1),
	};
};
