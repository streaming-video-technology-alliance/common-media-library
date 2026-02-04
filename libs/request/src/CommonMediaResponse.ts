import type { Response } from '@svta/cml-utils'
import type { CommonMediaRequest } from './CommonMediaRequest.ts'
import type { ResourceTiming } from './ResourceTiming.ts'
import type { ResponseTypeMap } from './ResponseTypeMap.ts'

/**
 * Common response API.
 *
 * @public
 */

export type CommonMediaResponse<R extends CommonMediaRequest = CommonMediaRequest> =
	Response<R, ResponseTypeMap<R['responseType']>> & {
	/**
	 * The network timing of the request/response.
	 */
	resourceTiming?: ResourceTiming;
};
