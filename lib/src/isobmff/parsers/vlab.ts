import type { IsoView } from '../IsoView';

export type WebVTTSourceLabelBox = {
	sourceLabel: string;
};

// ISO/IEC 14496-30:2014 - WebVTT Source Label Box
export function vlab(view: IsoView): WebVTTSourceLabelBox {
	return {
		sourceLabel: view.readUtf8(-1),
	};
};
