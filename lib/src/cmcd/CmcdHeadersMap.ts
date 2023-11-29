import { CmcdHeaderField } from './CmcdHeaderField.js';
import { CmcdKey } from './CmcdKey.js';

/**
 * A map of CMCD header fields to CMCD keys.
 *
 * @group CMCD
 *
 * @beta
 */
export type CmcdHeadersMap = Record<CmcdHeaderField, CmcdKey[]>;
