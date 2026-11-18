import type { IsoInt64 } from '../IsoInt64.ts'
import type { FullBox } from './FullBox.ts'

/**
 * Media Header Box (`mdhd`).
 *
 * ISO/IEC 14496-12:2015 - 8.4.2
 *
 * @public
 */
export type MediaHeaderBox<V extends IsoInt64 = number> = FullBox & {
	type: 'mdhd'

	/** The creation time of the media in this track, in seconds since midnight, 1904-01-01, UTC. The field has 32 bits in version 0 and 64 bits in version 1. */
	creationTime: V

	/** The most recent time the media in this track was modified, in seconds since midnight, 1904-01-01, UTC. */
	modificationTime: V

	/** The number of time units that pass in one second for this media. */
	timescale: number

	/** The duration of this media in units of `timescale`. All bits set means that the duration cannot be determined. */
	duration: V

	/** The ISO 639-2/T language code, three lower-case letters. */
	language: string

	/** The `pre_defined` field. `writeMdhd` writes 0 for a missing value. */
	preDefined?: number
}
