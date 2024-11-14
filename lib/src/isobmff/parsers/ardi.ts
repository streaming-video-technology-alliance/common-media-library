import type { FullBox } from '../FullBox.js';
import type { IsoView } from '../IsoView.js';

export type AudioRenderingIndicationBox = FullBox & {
	audioRenderingIndication: number;
}

// ISO/IEC 14496-12:202x - 12.2.8 Audio rendering indication box
export function ardi(view: IsoView): AudioRenderingIndicationBox {
	return {
		...view.readFullBox(),
		audioRenderingIndication: view.readUint(1),
	};
};
