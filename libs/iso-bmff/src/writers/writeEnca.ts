import type { AudioSampleEntry } from '../boxes/AudioSampleEntry.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteConfig } from '../IsoBoxWriteConfig.ts'
import { writeAudioSampleEntry } from './writeAudioSampleEntry.ts'

/**
 * Write the `enca` box (`AudioSampleEntry`).
 *
 * @param box - The `AudioSampleEntry` fields to write
 * @param config - The `IsoBoxWriteConfig` with the writers for the child boxes
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
export function writeEnca(
	box: AudioSampleEntry<'enca'>,
	config: IsoBoxWriteConfig,
): IsoBoxWriteView {
	return writeAudioSampleEntry(box, config)
}
