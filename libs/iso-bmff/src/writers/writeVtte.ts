import type { WebVttEmptySampleBox } from '../boxes/WebVttEmptySampleBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write the `vtte` box (`WebVttEmptySampleBox`).
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
// eslint-disable-next-line
export function writeVtte(_: WebVttEmptySampleBox): IsoBoxWriteView {
	const headerSize = 8
	const totalSize = headerSize

	const writer = new IsoBoxWriteView('vtte', totalSize)
	return writer
}
