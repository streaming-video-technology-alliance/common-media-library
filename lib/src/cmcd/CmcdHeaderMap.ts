import type { CmcdHeaderField } from './CmcdHeaderField.js';
import type { CmcdKey } from './CmcdKey.js';

/**
 * A map of CMCD header fields to CMCD keys.
 *
 * @group CMCD
 *
 * @beta
 */
export type CmcdHeaderMap = Record<CmcdHeaderField, CmcdKey[]>;
