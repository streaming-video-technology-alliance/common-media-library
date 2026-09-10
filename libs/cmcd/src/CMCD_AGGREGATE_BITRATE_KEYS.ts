import type { CmcdKey } from './CmcdKey.ts'

/**
 * Maps each aggregate bitrate key to the exact bitrate key that supersedes it.
 *
 * Per CTA-5004-B, `ab`, `lab`, and `tab` MUST NOT be sent when the encoded
 * bitrate (`br`), the lowest bitrate (`lb`), or the top bitrate (`tb`) is known.
 *
 * @internal
 */
export const CMCD_AGGREGATE_BITRATE_KEYS: Record<string, CmcdKey> = {
	ab: 'br',
	lab: 'lb',
	tab: 'tb',
}
