import type { AudioRenderingIndicationBox } from '../boxes/AudioRenderingIndicationBox.ts';
import type { Fields } from '../boxes/Fields.ts';
import type { IsoView } from '../IsoView.ts';

/**
 * Parse a AudioRenderingIndicationBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed AudioRenderingIndicationBox
 *
 *
 * @beta
 */
export function ardi(view: IsoView): Fields<AudioRenderingIndicationBox> {
	return {
		...view.readFullBox(),
		audioRenderingIndication: view.readUint(1),
	};
};
