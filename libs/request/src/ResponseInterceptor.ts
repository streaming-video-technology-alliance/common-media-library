import type { CommonMediaResponse } from './CommonMediaResponse.ts'

/**
 * Response interceptor API.
 * @param response - The received response.
 * @returns A promise with updated response that is resolved when the interceptor has completed the process of the response.
 *
 *
 * @beta
 */
export type ResponseInterceptor = (response: CommonMediaResponse) => Promise<CommonMediaResponse>;
