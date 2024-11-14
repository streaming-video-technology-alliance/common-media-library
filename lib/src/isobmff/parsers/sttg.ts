import type { IsoView } from '../IsoView';

export type WebVTTSettingsBox = {
	settings: string;
};

// ISO/IEC 14496-30:2014 - WebVTT Cue Settings Box.
export function sttg(view: IsoView): WebVTTSettingsBox {
	return {
		settings: view.readUtf8(-1),
	};
};
