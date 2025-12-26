import type { ValueOf } from '@svta/cml-utils'
import { CmcdTransmissionMode } from './CmcdTransmissionMode.ts'

/**
 * CMCD encoding types.
 *
 *
 * @enum
 *
 * @public
 *
 * @deprecated Use {@link CmcdTransmissionMode} instead.
 *
 * @see {@link CmcdTransmissionMode}
 */
export const CmcdEncoding: typeof CmcdTransmissionMode = CmcdTransmissionMode

/**
 * @public
 */
export type CmcdEncoding = ValueOf<typeof CmcdEncoding>;
