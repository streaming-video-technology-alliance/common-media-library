import type { ValueOf } from '@svta/cml-utils/ValueOf.js';
import { CmcdTransmissionMode } from './CmcdTransmissionMode.js';

/**
 * CMCD encoding types.
 *
 * @group CMCD
 *
 * @enum
 *
 * @beta
 *
 * @deprecated Use {@link CmcdTransmissionMode} instead.
 *
 * @see {@link CmcdTransmissionMode}
 */
export const CmcdEncoding: typeof CmcdTransmissionMode = CmcdTransmissionMode;

/**
 * @beta
 */
export type CmcdEncoding = ValueOf<typeof CmcdEncoding>;
