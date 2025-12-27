import type { AudioRenderingIndicationBox } from '../boxes/types/AudioRenderingIndicationBox.ts'
import type { Fields } from '../boxes/types/Fields.ts'
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
export function readArdi(view: IsoBoxReadView): Fields<AudioRenderingIndicationBox> {
	return {
		...view.readFullBox(),
		audioRenderingIndication: view.readUint(1),
	}
};
