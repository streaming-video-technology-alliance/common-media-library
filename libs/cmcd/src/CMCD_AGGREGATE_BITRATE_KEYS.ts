import type { CmcdKey } from './CmcdKey.ts'

/**
 * Maps each aggregate bitrate key to the exact bitrate key that supersedes it.
 *
 * Per CTA-5004-B, `ab` MUST NOT be sent when the encoded bitrate `br` is
 * known. `lab` and `tab` follow the same rule for the lowest bitrate `lb`
 * and the top bitrate `tb`.
 *
 * @internal
 */
export const CMCD_AGGREGATE_BITRATE_KEYS: Record<string, CmcdKey> = {
	ab: 'br',
	lab: 'lb',
	tab: 'tb',
}
