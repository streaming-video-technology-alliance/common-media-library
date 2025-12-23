import { IsoDataWriter } from '../utils/IsoDataWriter.ts'

/**
 * Write a WebVttEmptySampleBox to an IsoDataWriter.
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @beta
 */
export function writeVtte(): IsoDataWriter {
	const headerSize = 8
	const totalSize = headerSize

	const writer = new IsoDataWriter(totalSize)
	writer.writeBoxHeader('vtte', totalSize)

	return writer
}
