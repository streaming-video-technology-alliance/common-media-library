import type { MetaBox } from '../boxes/MetaBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteViewConfig } from '../IsoBoxWriteViewConfig.ts'
import type { IsoInt64 } from '../IsoInt64.ts'
import { writeChildBoxes } from '../utils/writeChildBoxes.ts'

/**
 * Write a `MetaBox` to an `IsoBoxWriteView`.
 *
 * ISO/IEC 14496-12:2012 - 8.11.1 Meta Box
 *
 * Each 64-bit integer field of a child box is a `number` or a `bigint`.
 *
 * @param box - The `MetaBox` fields to write
 * @param config - The `IsoBoxWriteViewConfig` to use
 *
 * @returns An `IsoBoxWriteView` containing the encoded box
 *
 * @public
 */
export function writeMeta(box: MetaBox<IsoInt64>, config: IsoBoxWriteViewConfig): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4

	const { bytes, size } = writeChildBoxes(box.boxes, config)

	const totalSize = headerSize + fullBoxSize + size

	const writer = new IsoBoxWriteView('meta', totalSize)
	writer.writeFullBox(box.version, box.flags)
	writer.writeBytes(bytes)

	return writer
}
