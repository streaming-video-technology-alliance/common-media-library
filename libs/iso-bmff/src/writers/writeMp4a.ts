import type { AudioSampleEntryBox } from '../boxes/AudioSampleEntryBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteViewConfig } from '../IsoBoxWriteViewConfig.ts'
import { writeAudioSampleEntryBox } from './writeAudioSampleEntryBox.ts'

/**
 * Write an AudioSampleEntryBox to an IsoDataWriter.
 *
 * ISO/IEC 14496-12:2012 - 12.2.3 Audio Sample Entry
 *
 * @param box - The AudioSampleEntryBox fields to write
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeMp4a(box: AudioSampleEntryBox<'mp4a'>, config: IsoBoxWriteViewConfig): IsoBoxWriteView {
	return writeAudioSampleEntryBox(box, config)
}
