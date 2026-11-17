import type { AudioSampleEntryBox } from '../boxes/AudioSampleEntryBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteViewConfig } from '../IsoBoxWriteViewConfig.ts'
import { writeAudioSampleEntryBox } from './writeAudioSampleEntryBox.ts'

/**
 * Write the `enca` box (`AudioSampleEntryBox`).
 *
 * @param box - The `AudioSampleEntryBox` fields to write
 * @param config - The `IsoBoxWriteViewConfig` with the writers for the child boxes
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
export function writeEnca(
	box: AudioSampleEntryBox<'enca'>,
	config: IsoBoxWriteViewConfig,
): IsoBoxWriteView {
	return writeAudioSampleEntryBox(box, config)
}
