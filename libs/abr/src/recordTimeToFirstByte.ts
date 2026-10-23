import type { ResourceTiming } from '@svta/cml-utils'
import { getTimeToFirstByte } from '@svta/cml-utils'
import { TIME_TO_FIRST_BYTE_SAMPLE_COUNT } from './TIME_TO_FIRST_BYTE_SAMPLE_COUNT.ts'
import { MILLISECONDS_PER_SECOND } from './MILLISECONDS_PER_SECOND.ts'

/**
 * Adds the time to first byte of a finished download to `samples`, in seconds.
 * The array keeps the last `TIME_TO_FIRST_BYTE_SAMPLE_COUNT` values.
 * A timing without a usable `responseStart` adds nothing.
 *
 * @param samples - The time to first byte of the last finished downloads, in seconds
 * @param timing - The timing of the download
 */
export function recordTimeToFirstByte(samples: number[], timing: ResourceTiming): void {
	const timeToFirstByteMs = getTimeToFirstByte(timing)

	if (!Number.isFinite(timeToFirstByteMs)) {
		return
	}

	if (samples.length === TIME_TO_FIRST_BYTE_SAMPLE_COUNT) {
		samples.shift()
	}

	samples.push(timeToFirstByteMs / MILLISECONDS_PER_SECOND)
}
