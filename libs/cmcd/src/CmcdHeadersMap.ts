import type { CmcdHeaderField } from './CmcdHeaderField.js';
import type { CmcdKey } from './CmcdKey.js';

/**
 * A map of CMCD header fields to CMCD keys.
 *
 *
 * @beta
 *
 * @deprecated Use `CmcdHeaderMap` instead.
 */
export type CmcdHeadersMap = Record<CmcdHeaderField, CmcdKey[]>;
