import type { IsoBoxType } from '../IsoBoxType.ts'
import type { SampleEntryBox } from './SampleEntryBox.ts'
import type { VisualSampleEntryType } from './VisualSampleEntryType.ts'

/**
 * Child boxes of Visual Sample Entry Box
 *
 * @public
 */
export type VisualSampleEntryBoxChild = any

/**
 * Visual Sample Entry Box, such as `avc1`, `hvc1`, or `encv`.
 *
 * ISO/IEC 14496-12:2015 - 12.1.3
 *
 * @public
 */
export type VisualSampleEntryBox<T extends IsoBoxType = VisualSampleEntryType> = SampleEntryBox & {
	type: T
	preDefined1: number
	reserved2: number
	preDefined2: number[]
	width: number
	height: number
	horizresolution: number
	vertresolution: number
	reserved3: number
	frameCount: number
	compressorName: number[]
	depth: number
	preDefined3: number
	boxes: VisualSampleEntryBoxChild[]
}
