import type { Response } from '@svta/cml-utils'
import type { CommonMediaRequest } from './CommonMediaRequest.ts'
import type { ResourceTiming } from './ResourceTiming.ts'

/**
 * Common response API.
 *
 * @public
 */

export type CommonMediaResponse<R extends CommonMediaRequest = CommonMediaRequest> =
	Response<R> & {
	/**
	 * The network timing of the request/response.
	 */
	resourceTiming?: ResourceTiming;
};
