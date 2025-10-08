import { CMCD_FORMATTER_MAP } from './CMCD_FORMATTER_MAP.js';
import type { CmcdFormatter } from './CmcdFormatter.js';

/**
 * The default formatters for CMCD values.
 *
 *
 * @beta
 *
 * @deprecated Use `CMCD_FORMATTER_MAP` instead.
 */
export const CmcdFormatters: Record<string, CmcdFormatter> = CMCD_FORMATTER_MAP;
