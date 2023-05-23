import { CommonMediaResponse } from './CommonMediaResponse.js'

/**
 * Response plugin API.
 * @param response - The received response.
 * @returns A promise that is resolved when the plugin has completed the manipulation of the response.
 * 
 * @group Request
 */
export type ResponsePlugin = (response: CommonMediaResponse) => Promise<void>
