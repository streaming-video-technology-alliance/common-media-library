import type { IsoView } from '../IsoView';

/**
 * ISO/IEC 14496-30:2014 - WebVTT Cue Payload Box.
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type WebVTTCuePayloadBox = {
	cueText: string;
};

/**
 * Parse a WebVTTCuePayloadBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed WebVTTCuePayloadBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function payl(view: IsoView): WebVTTCuePayloadBox {
	return {
		cueText: view.readUtf8(-1),
	};
};
