import type { AudioRenderingIndicationBox } from '../boxes/AudioRenderingIndicationBox.js';
import type { Fields } from '../boxes/Fields.js';
import type { IsoView } from '../IsoView.js';

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
