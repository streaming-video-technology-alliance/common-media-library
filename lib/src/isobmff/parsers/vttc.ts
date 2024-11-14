import type { IsoView } from '../IsoView';

export type WebVTTConfigurationBox = {
	config: string;
};

// ISO/IEC 14496-30:2014 - WebVTT Configuration Box
export function vttc(view: IsoView): WebVTTConfigurationBox {
	return {
		config: view.readUtf8(-1),
	};
};
