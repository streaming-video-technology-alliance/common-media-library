import type { DataInformationBox } from './DataInformationBox.ts'
import type { SampleTableBox } from './SampleTableBox.ts'
import type { SoundMediaHeaderBox } from './SoundMediaHeaderBox.ts'
import type { SubtitleMediaHeaderBox } from './SubtitleMediaHeaderBox.ts'
import type { VideoMediaHeaderBox } from './VideoMediaHeaderBox.ts'

/**
 * Child boxes of Media Information Box
 *
 * @public
 */
export type MediaInformationBoxChild =
	| VideoMediaHeaderBox
	| SoundMediaHeaderBox
	| DataInformationBox
	| SampleTableBox
	| SubtitleMediaHeaderBox

/**
 * Media Information Box (`minf`).
 *
 * ISO/IEC 14496-12:2015 - 8.4.4
 *
 * @public
 */
export type MediaInformationBox = {
	type: 'minf'
	boxes: MediaInformationBoxChild[]
}
