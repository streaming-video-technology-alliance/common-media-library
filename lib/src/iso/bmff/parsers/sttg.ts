import type { IsoView } from '../IsoView.js';

/**
 * ISO/IEC 14496-30:2014 - WebVTT Cue Settings Box.
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type WebVTTSettingsBox = {
	settings: string;
};

/**
 * Parse a WebVTTSettingsBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed WebVTTSettingsBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function sttg(view: IsoView): WebVTTSettingsBox {
	return {
		settings: view.readUtf8(-1),
	};
};
