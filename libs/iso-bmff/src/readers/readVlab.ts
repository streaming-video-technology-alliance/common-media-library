import type { WebVttSourceLabelBox } from '../boxes/WebVttSourceLabelBox.ts'
import type { IsoBoxReadView } from '../IsoBoxReadView.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * Read the `vlab` box (`WebVttSourceLabelBox`).
 *
 * @param view - The `IsoBoxReadView` to read data from
 *
 * @returns A parsed `WebVttSourceLabelBox`
 *
 * @example
 * {@includeCode ../../test/readers/readVlab.test.ts#example}
 *
 * @public
 */
export function readVlab(view: IsoBoxReadView<IsoInt64>): WebVttSourceLabelBox {
	return {
		type: 'vlab',
		sourceLabel: view.readUtf8(-1),
	}
}
