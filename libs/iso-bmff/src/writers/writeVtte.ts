import type { WebVttEmptySampleBox } from '../boxes/WebVttEmptySampleBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a `WebVttEmptySampleBox` to an `IsoBoxWriteView`.
 *
 * The box has no fields, so the function writes only the box header.
 *
 * @param _box - The `WebVttEmptySampleBox` fields to write
 *
 * @returns An `IsoBoxWriteView` containing the encoded box
 *
 * @public
 */
// oxlint-disable-next-line no-unused-vars
export function writeVtte(_box: WebVttEmptySampleBox): IsoBoxWriteView {
	const headerSize = 8
	const totalSize = headerSize

	const writer = new IsoBoxWriteView('vtte', totalSize)
	return writer
}
