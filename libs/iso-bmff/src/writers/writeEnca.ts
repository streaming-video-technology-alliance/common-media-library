import type { AudioSampleEntryBox } from '../boxes/AudioSampleEntryBox.ts'
import { IsoBoxWriteView } from '../IsoBoxWriteView.ts'
import type { IsoBoxWriteViewConfig } from '../IsoBoxWriteViewConfig.ts'
import { writeAudioSampleEntryBox } from './writeAudioSampleEntryBox.ts'

/**
 * Write an AudioSampleEntryBox (enca) to an IsoDataWriter.
 *
 * @param box - The AudioSampleEntryBox fields to write
 * @param config - The IsoBoxWriteViewConfig to use
 *
 * @returns An IsoDataWriter containing the encoded box
 *
 * @public
 */
export function writeEnca(box: AudioSampleEntryBox<'enca'>, config: IsoBoxWriteViewConfig): IsoBoxWriteView {
	return writeAudioSampleEntryBox(box, config)
}
