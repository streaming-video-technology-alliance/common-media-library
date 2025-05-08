import type { ValueOf } from '../../utils/ValueOf.ts';
import { HW_SECURE_ALL } from './HW_SECURE_ALL.ts';
import { HW_SECURE_CRYPTO } from './HW_SECURE_CRYPTO.ts';
import { HW_SECURE_DECODE } from './HW_SECURE_DECODE.ts';
import { SW_SECURE_CRYPTO } from './SW_SECURE_CRYPTO.ts';
import { SW_SECURE_DECODE } from './SW_SECURE_DECODE.ts';

/**
 * Widevine Robustness.
 *
 * @group DRM
 *
 * @beta
 */
export const WidevineRobustness = {
	SW_SECURE_CRYPTO: SW_SECURE_CRYPTO as typeof SW_SECURE_CRYPTO,
	SW_SECURE_DECODE: SW_SECURE_DECODE as typeof SW_SECURE_DECODE,
	HW_SECURE_CRYPTO: HW_SECURE_CRYPTO as typeof HW_SECURE_CRYPTO,
	HW_SECURE_DECODE: HW_SECURE_DECODE as typeof HW_SECURE_DECODE,
	HW_SECURE_ALL: HW_SECURE_ALL as typeof HW_SECURE_ALL,
} as const;

/**
 * Widevine Robustness.
 *
 * @group DRM
 *
 * @beta
 */
export type WidevineRobustness = ValueOf<typeof WidevineRobustness>;
