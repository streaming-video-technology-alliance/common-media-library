import type { IsoView } from '../IsoView.js';

export type WebVTTCuePayloadBox = {
	cueText: string;
};

// ISO/IEC 14496-30:2014 - WebVTT Cue Payload Box.
export function payl(view: IsoView): WebVTTCuePayloadBox {
	return {
		cueText: view.readUtf8(-1),
	};
};
