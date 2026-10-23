import type { ResourceTiming } from '@svta/cml-utils'
import { getTimeToFirstByteMs } from '@svta/cml-utils'
import { FIRST_BYTE_WAIT_SAMPLE_COUNT } from './FIRST_BYTE_WAIT_SAMPLE_COUNT.ts'
import { MILLISECONDS_PER_SECOND } from './MILLISECONDS_PER_SECOND.ts'

/**
 * Adds the first-byte wait of a finished download to `waits`, in seconds.
 * The array keeps the last `FIRST_BYTE_WAIT_SAMPLE_COUNT` waits.
 * A timing without a usable `responseStart` adds nothing.
 *
 * @param waits - The first-byte waits of the last finished downloads, in seconds
 * @param timing - The timing of the download
 */
export function recordFirstByteWait(waits: number[], timing: ResourceTiming): void {
	const waitMs = getTimeToFirstByteMs(timing)

	if (!Number.isFinite(waitMs)) {
		return
	}

	if (waits.length === FIRST_BYTE_WAIT_SAMPLE_COUNT) {
		waits.shift()
	}

	waits.push(waitMs / MILLISECONDS_PER_SECOND)
}
