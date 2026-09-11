import type { Cmcd } from './Cmcd.ts'
import type { CmcdRequestLike } from './CmcdRequestLike.ts'

/**
 * Changes or cancels one request-mode report before it is placed on the request. Return `null` to cancel.
 *
 * @public
 */
export type CmcdRequestTransform = (data: Cmcd, request: Readonly<CmcdRequestLike>) => Cmcd | null
