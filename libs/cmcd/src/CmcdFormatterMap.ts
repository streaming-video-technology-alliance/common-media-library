import type { CmcdFormatter } from './CmcdFormatter.ts';
import type { CmcdKey } from './CmcdKey.ts';

/**
 * A map of CMCD keys to format functions.
 *
 *
 * @beta
 */
export type CmcdFormatterMap = Record<CmcdKey, CmcdFormatter>;
