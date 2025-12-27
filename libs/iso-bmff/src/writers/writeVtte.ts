import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'

/**
 * Write a WebVttEmptySampleBox to an IsoDataWriter.
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeVtte(): IsoBoxWriteView {
	const headerSize = 8
	const totalSize = headerSize

	const writer = new IsoBoxWriteView(totalSize)
	writer.writeBoxHeader('vtte', totalSize)

	return writer
}
