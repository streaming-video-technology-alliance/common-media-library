import type { WebVttEmptySampleBox } from '../boxes/WebVttEmptySampleBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a `WebVttEmptySampleBox` to an `IsoBoxWriteView`.
 *
 * @returns An `IsoBoxWriteView` containing the encoded box
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
