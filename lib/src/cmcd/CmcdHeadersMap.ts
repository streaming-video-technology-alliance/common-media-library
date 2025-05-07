import type { CmcdHeaderField } from './CmcdHeaderField.ts';
import type { CmcdKey } from './CmcdKey.ts';

/**
 * A map of CMCD header fields to CMCD keys.
 *
 * @group CMCD
 *
 * @beta
 */
export type CmcdHeadersMap = Record<CmcdHeaderField, CmcdKey[]>;
