import type { SampleDescriptionBox } from '../boxes/SampleDescriptionBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteViewConfig } from '../IsoBoxWriteViewConfig.ts'
import { writeChildBoxes } from '../utils/writeChildBoxes.ts'

/**
 * Write the `stsd` box (`SampleDescriptionBox`).
 *
 * @param box - The `SampleDescriptionBox` fields to write
 * @param config - The `IsoBoxWriteViewConfig` with the writers for the child boxes
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @example
 * {@includeCode ../../test/writers/writeStsd.test.ts#example}
 *
 * @public
 */
export function writeStsd(
	box: SampleDescriptionBox,
	config: IsoBoxWriteViewConfig,
): IsoBoxWriteView {
	const headerSize = 8
	const fullBoxSize = 4
	const entryCountSize = 4
	const entryCount = box.boxes.length

	// TODO: Is there a way to avoid creating the intermediate Uint8Arrays?
	const { bytes, size } = writeChildBoxes(box.boxes, config)
	const totalSize = headerSize + fullBoxSize + entryCountSize + size

	const writer = new IsoBoxWriteView('stsd', totalSize)
	writer.writeFullBox(box.version, box.flags)
	writer.writeUint(entryCount, 4)
	writer.writeBytes(bytes)

	return writer
}
