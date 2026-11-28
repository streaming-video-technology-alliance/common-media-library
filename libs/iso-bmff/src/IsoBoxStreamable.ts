import type { AudioSampleEntry } from './boxes/AudioSampleEntry.ts'
import type { AudioSampleEntryType } from './boxes/AudioSampleEntryType.ts'
import type { VisualSampleEntry } from './boxes/VisualSampleEntry.ts'
import type { VisualSampleEntryType } from './boxes/VisualSampleEntryType.ts'
import type { IsoBox } from './IsoBox.ts'
import type { IsoInt64 } from './IsoInt64.ts'
import type { IsoRawBox } from './IsoRawBox.ts'

/**
 * A value that the write functions take: a box object, a raw box, or the bytes of a box.
 *
 * A box object has the type of a box type of `IsoBoxMap`. Add a box type that the package does not name to `IsoCustomBoxMap`.
 * A 64-bit integer field takes a `number` or a `bigint`.
 *
 * @public
 */
export type IsoBoxStreamable =
	| IsoBox<IsoInt64>
	| AudioSampleEntry<AudioSampleEntryType, IsoInt64>
	| VisualSampleEntry<VisualSampleEntryType, IsoInt64>
	| IsoRawBox
	| ArrayBufferView
