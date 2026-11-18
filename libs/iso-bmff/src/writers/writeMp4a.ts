import type { AudioSampleEntry } from '../boxes/AudioSampleEntry.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteConfig } from '../IsoBoxWriteConfig.ts'
import { writeAudioSampleEntry } from './writeAudioSampleEntry.ts'

/**
 * Write the `mp4a` box (`AudioSampleEntry`).
 *
 * ISO/IEC 14496-12:2015 - 12.2.3
 *
 * @param box - The `AudioSampleEntry` fields to write
 * @param config - The `IsoBoxWriteConfig` with the writers for the child boxes
 *
 * @returns An `IsoBoxWriteView` containing the written box
 *
 * @public
 */
export function writeMp4a(
	box: AudioSampleEntry<'mp4a'>,
	config: IsoBoxWriteConfig,
): IsoBoxWriteView {
	return writeAudioSampleEntry(box, config)
}
