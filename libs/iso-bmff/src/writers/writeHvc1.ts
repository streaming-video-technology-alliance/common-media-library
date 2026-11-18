import type { VisualSampleEntry } from '../boxes/VisualSampleEntry.ts'
import type { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteConfig } from '../IsoBoxWriteConfig.ts'
import { writeVisualSampleEntry } from './writeVisualSampleEntry.ts'

/**
 * Write the `hvc1` box (`VisualSampleEntry`).
 *
 * @param box - The `VisualSampleEntry` fields to write
 * @param config - The `IsoBoxWriteConfig` with the writers for the child boxes
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
export function writeHvc1(
	box: VisualSampleEntry<'hvc1'>,
	config: IsoBoxWriteConfig,
): IsoBoxWriteView {
	return writeVisualSampleEntry(box, config)
}
