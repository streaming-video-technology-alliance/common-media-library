import type { AudioSampleEntryBox } from '../boxes/AudioSampleEntryBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteViewConfig } from '../IsoBoxWriteViewConfig.ts'
import { writeAudioSampleEntryBox } from './writeAudioSampleEntryBox.ts'

/**
 * Write the `mp4a` box (`AudioSampleEntryBox`).
 *
 * ISO/IEC 14496-12:2015 - 12.2.3
 *
 * @param box - The `AudioSampleEntryBox` fields to write
 * @param config - The `IsoBoxWriteViewConfig` with the writers for the child boxes
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
export function writeMp4a(
	box: AudioSampleEntryBox<'mp4a'>,
	config: IsoBoxWriteViewConfig,
): IsoBoxWriteView {
	return writeAudioSampleEntryBox(box, config)
}
