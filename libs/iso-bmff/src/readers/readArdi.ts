import type { AudioRenderingIndicationBox } from '../boxes/AudioRenderingIndicationBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'

/**
 * Parse a AudioRenderingIndicationBox from an IsoView
 *
 * @param view - The IsoView to read data from
 *
 * @returns A parsed AudioRenderingIndicationBox
 *
 * @public
 */
export function readArdi(view: IsoBoxReadView): AudioRenderingIndicationBox {
	return {
		type: 'ardi',
		...view.readFullBox(),
		audioRenderingIndication: view.readUint(1),
	}
};
