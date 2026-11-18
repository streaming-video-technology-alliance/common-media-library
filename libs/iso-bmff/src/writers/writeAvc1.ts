import type { VisualSampleEntry } from '../boxes/VisualSampleEntry.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteConfig } from '../IsoBoxWriteConfig.ts'
import { writeVisualSampleEntry } from './writeVisualSampleEntry.ts'

/**
 * Write the `avc1` box (`VisualSampleEntry`).
 *
 * ISO/IEC 14496-12:2015 - 12.1.3
 *
 * @param box - The `VisualSampleEntry` fields to write
 * @param config - The `IsoBoxWriteConfig` with the writers for the child boxes
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
export function writeAvc1(
	box: VisualSampleEntry<'avc1'>,
	config: IsoBoxWriteConfig,
): IsoBoxWriteView {
	return writeVisualSampleEntry(box, config)
}
