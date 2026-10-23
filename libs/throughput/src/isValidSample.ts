import type { ResourceTiming } from '@svta/cml-utils'
import { getTransferDurationMs } from '@svta/cml-utils'

/**
 * Returns true when the sample has a finite `encodedBodySize` above 0 and a finite transfer
 * duration above 0. The transfer duration comes from `getTransferDurationMs`.
 *
 * @param sample - The timing sample
 * @returns Whether the sample counts as a throughput measurement
 */
export function isValidSample(sample: ResourceTiming): boolean {
	const { encodedBodySize } = sample
	const transferMs = getTransferDurationMs(sample)

	return (
		Number.isFinite(encodedBodySize) &&
		encodedBodySize > 0 &&
		Number.isFinite(transferMs) &&
		transferMs > 0
	)
}
