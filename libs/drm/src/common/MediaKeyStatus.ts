import type { ValueOf } from '@svta/cml-utils'
import { EXPIRED } from './EXPIRED.ts'
import { INTERNAL_ERROR } from './INTERNAL_ERROR.ts'
import { OUTPUT_DOWNSCALED } from './OUTPUT_DOWNSCALED.ts'
import { OUTPUT_RESTRICTED } from './OUTPUT_RESTRICTED.ts'
import { RELEASED } from './RELEASED.ts'
import { STATUS_PENDING } from './STATUS_PENDING.ts'
import { USABLE } from './USABLE.ts'

/**
 * Media Key Statuses.
 *
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
} as const

/**
 * Media Key Statuses.
 *
 *
 * @beta
 */
export type MediaKeyStatus = ValueOf<typeof MediaKeyStatus>;
