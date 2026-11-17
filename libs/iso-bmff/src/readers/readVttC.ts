import type { WebVttConfigurationBox } from '../boxes/WebVttConfigurationBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Parse a `WebVttConfigurationBox` from an `IsoBoxReadView`.
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `WebVttConfigurationBox`
 *
 * @public
 */
export function readVttC(view: IsoBoxReadView<IsoInt64>): WebVttConfigurationBox {
	return {
		type: 'vttC',
		config: view.readUtf8(),
	}
}
