import type { TrackExtendsBox } from '../boxes/TrackExtendsBox.ts'
import type { TrackFragmentHeaderBox } from '../boxes/TrackFragmentHeaderBox.ts'
import type { TrackRunBox } from '../boxes/TrackRunBox.ts'
import type { IsoInt64 } from '../IsoInt64.ts'

/**
 * One sample of a `trun` box with the values that the `tfhd` and `trex` defaults supply.
 *
 * A field is `undefined` when the `trun` box, the `tfhd` box, and the `trex` box have no value for it.
 *
 * @public
 */
export type ResolvedTrackRunSample = {
	/** The duration of the sample, in the timescale of the track. */
	sampleDuration?: number
	/** The size of the sample in bytes. */
	sampleSize?: number
	/** The flags of the sample, as the `sample_flags` field of ISO/IEC 14496-12, clause 8.8.3.1. */
	sampleFlags?: number
	/** The composition time offset of the sample. A box with no offsets has 0. */
	sampleCompositionTimeOffset: number
}

/**
 * Resolves the fields of each sample of a `trun` box from the defaults of the `tfhd` box and the `trex` box.
 *
 * ISO/IEC 14496-12:2015 - 8.8.8.1
 *
 * A sample field that the `trun` box has wins. A missing field takes the default of the `tfhd` box, then the default of the `trex` box.
 * `firstSampleFlags` of the `trun` box replaces the default flags of the first sample only.
 * A missing composition time offset is 0.
 *
 * The `trex` box is the one of the track of the fragment: `tfhd.trackId === trex.trackId`. The function does not check the track.
 *
 * @param trun - The `trun` box.
 * @param tfhd - The `tfhd` box of the same `traf` box.
 * @param trex - The `trex` box of the track, from the `moov` box.
 * @returns One object for each sample of the `trun` box, in the order of the box.
 *
 * @example
 * {@includeCode ../../test/resolveTrunSamples.test.ts#example}
 *
 * @public
 */
export function resolveTrunSamples(
	trun: TrackRunBox,
	tfhd?: TrackFragmentHeaderBox<IsoInt64>,
	trex?: TrackExtendsBox,
): ResolvedTrackRunSample[] {
	const { samples, firstSampleFlags } = trun
	const duration = tfhd?.defaultSampleDuration ?? trex?.defaultSampleDuration
	const size = tfhd?.defaultSampleSize ?? trex?.defaultSampleSize
	const flags = tfhd?.defaultSampleFlags ?? trex?.defaultSampleFlags
	const result: ResolvedTrackRunSample[] = new Array<ResolvedTrackRunSample>(samples.length)

	samples.forEach((sample, i) => {
		result[i] = {
			sampleDuration: sample.sampleDuration ?? duration,
			sampleSize: sample.sampleSize ?? size,
			sampleFlags:
				sample.sampleFlags ??
				(i === 0 && firstSampleFlags !== undefined ? firstSampleFlags : flags),
			sampleCompositionTimeOffset: sample.sampleCompositionTimeOffset ?? 0,
		}
	})

	return result
}
