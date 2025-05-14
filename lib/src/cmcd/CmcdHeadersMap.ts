import type { CmcdHeaderField } from './CmcdHeaderField';
import type { CmcdKey } from './CmcdKey';

/**
 * A map of CMCD header fields to CMCD keys.
 *
 * @group CMCD
 *
 * @beta
 */
export type CmcdHeadersMap = Record<CmcdHeaderField, CmcdKey[]>;
