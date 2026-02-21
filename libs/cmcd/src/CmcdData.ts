import type { Cmcd } from './Cmcd.ts'
import type { CmcdRequest } from './CmcdRequest.ts'
import type { CmcdV1 } from './CmcdV1.ts'

/**
 * CMCD version 1 data.
 *
 * Overrides keys whose types differ in version 1 (e.g., `bl` and `br`
 * are plain integers instead of inner lists).
 *
 * @public
 */
export type CmcdV1Data = Omit<CmcdRequest, keyof CmcdV1 | 'v'> & CmcdV1 & { v?: 1 }

/**
 * CMCD version 2 data.
 *
 * Includes all request, event, and response mode keys with version 2
 * types.
 *
 * @public
 */
export type CmcdV2Data = Omit<Cmcd, 'v'> & { v: 2 }

/**
 * A CMCD data object that is either version 1 or version 2.
 *
 * The `v` property acts as a discriminator:
 *
 * - When `v` is `2`, the type narrows to {@link CmcdV2Data} with
 *   inner-list values and event/response keys.
 * - When `v` is `1` or absent, the type narrows to {@link CmcdV1Data}
 *   with scalar values.
 *
 * @example
 * ```ts
 * function process(data: CmcdData) {
 *   if (data.v === 2) {
 *     // data.bl is CmcdObjectTypeList | undefined
 *   } else {
 *     // data.bl is number | undefined
 *   }
 * }
 * ```
 *
 * @public
 */
export type CmcdData = CmcdV1Data | CmcdV2Data
