import type { ValueOf } from '../../utils/ValueOf.js';
import { EXPIRED } from './EXPIRED.js';
import { INTERNAL_ERROR } from './INTERNAL_ERROR.js';
import { OUTPUT_DOWNSCALED } from './OUTPUT_DOWNSCALED.js';
import { OUTPUT_RESTRICTED } from './OUTPUT_RESTRICTED.js';
import { RELEASED } from './RELEASED.js';
import { STATUS_PENDING } from './STATUS_PENDING.js';
import { USABLE } from './USABLE.js';

/**
 * Media Key Statuses.
 *
 * @group DRM
 *
 * @beta
 */
export const MediaKeyStatus = {
	USABLE: USABLE as typeof USABLE,
	EXPIRED: EXPIRED as typeof EXPIRED,
	RELEASED: RELEASED as typeof RELEASED,
	OUTPUT_RESTRICTED: OUTPUT_RESTRICTED as typeof OUTPUT_RESTRICTED,
	OUTPUT_DOWNSCALED: OUTPUT_DOWNSCALED as typeof OUTPUT_DOWNSCALED,
	STATUS_PENDING: STATUS_PENDING as typeof STATUS_PENDING,
	INTERNAL_ERROR: INTERNAL_ERROR as typeof INTERNAL_ERROR,
} as const;

/**
 * Media Key Statuses.
 *
 * @group DRM
 *
 * @beta
 */
export type MediaKeyStatus = ValueOf<typeof MediaKeyStatus>;
