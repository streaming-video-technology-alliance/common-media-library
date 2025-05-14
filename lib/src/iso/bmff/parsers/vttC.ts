import type { IsoView } from '../IsoView';

/**
 * ISO/IEC 14496-30:2014 - WebVTT Configuration Box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type WebVTTConfigurationBox = {
	config: string;
};

/**
 * Parse a WebVTTConfigurationBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed WebVTTConfigurationBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function vttC(view: IsoView): WebVTTConfigurationBox {
	return {
		config: view.readUtf8(),
	};
};
