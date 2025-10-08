import type { CmcdFormatter } from './CmcdFormatter.js';
import type { CmcdKey } from './CmcdKey.js';

/**
 * A map of CMCD keys to format functions.
 *
 *
 * @beta
 */
export type CmcdFormatterMap = Record<CmcdKey, CmcdFormatter>;
