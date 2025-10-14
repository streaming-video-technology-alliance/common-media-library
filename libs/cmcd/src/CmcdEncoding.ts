import type { ValueOf } from '@svta/cml-utils';
import { CmcdTransmissionMode } from './CmcdTransmissionMode.js';

/**
 * CMCD encoding types.
 *
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
