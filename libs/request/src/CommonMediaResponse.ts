import type { Response } from '@svta/cml-utils'
import type { CommonMediaRequest } from './CommonMediaRequest.ts'

/**
 * Common response API.
 *
 * @public
 */

export type CommonMediaResponse<R extends CommonMediaRequest = CommonMediaRequest> = Response<R>;
