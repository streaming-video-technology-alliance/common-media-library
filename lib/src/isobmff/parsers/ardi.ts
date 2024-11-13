import type { CursorView } from '../CursorView.js';
import type { FullBox } from '../FullBox.js';

export type AudioRenderingIndicationBox = FullBox & {
	audioRenderingIndication: number;
}

// ISO/IEC 14496-12:202x - 12.2.8 Audio rendering indication box
export function ardi(view: CursorView): AudioRenderingIndicationBox {
	return {
		...view.readFullBox(),
		audioRenderingIndication: view.readUint(1),
	};
};
