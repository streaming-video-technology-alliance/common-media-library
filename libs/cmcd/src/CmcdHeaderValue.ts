import type { CmcdRequest } from './CmcdRequest.ts'
import type { CmcdV1 } from './CmcdV1.ts'

/**
 * CMCD header value
 *
 * @public
 */
export type CmcdHeaderValue = CmcdRequest | CmcdV1
