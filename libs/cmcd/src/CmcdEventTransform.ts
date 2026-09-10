import type { Cmcd } from './Cmcd.ts'
import type { CmcdRequestLike } from './CmcdRequestLike.ts'

/**
 * Changes or cancels one event report before it is encoded. Return `null` to cancel.
 * `request` is the decorated request for an `rr` report, else `undefined`.
 *
 * @public
 */
export type CmcdEventTransform = (data: Cmcd, request: Readonly<CmcdRequestLike> | undefined) => Cmcd | null
