import type { FullBox } from '../FullBox.ts';
import type { IsoView } from '../IsoView.ts';

/**
 * ISO/IEC 14496-12:202x - 12.2.8 Audio rendering indication box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type AudioRenderingIndicationBox = FullBox & {
	audioRenderingIndication: number;
};

/**
 * Parse a AudioRenderingIndicationBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed AudioRenderingIndicationBox
 *
 * @group ISOBMFF
 *
 * @beta
 */
export function ardi(view: IsoView): AudioRenderingIndicationBox {
	return {
		...view.readFullBox(),
		audioRenderingIndication: view.readUint(1),
	};
};
