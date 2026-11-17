import type { AudioRenderingIndicationBox } from '../boxes/AudioRenderingIndicationBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `AudioRenderingIndicationBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `AudioRenderingIndicationBox`
 *
 * @public
 */
export function readArdi(view: IsoBoxReadView<IsoInt64>): AudioRenderingIndicationBox {
	return {
		type: 'ardi',
		...view.readFullBox(),
		audioRenderingIndication: view.readUint(1),
	}
}
