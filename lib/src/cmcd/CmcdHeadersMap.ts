import { CmcdHeaderField } from './CmcdHeaderField.js';
import { CmcdKey } from './CmcdKey.js';

/**
 * A map of CMCD header fields to CMCD keys.
 */
export type CmcdHeadersMap = Record<CmcdHeaderField, CmcdKey[]>;
