import { CommonMediaRequest } from './CommonMediaRequest.js';

/**
 * Request plugin API.
 * @param request - The request to be executed.
 * @returns A promise that is resolved when the plugin has completed the manipulation of the request.
 * 
 * @group Request
 */
export type RequestPlugin = (request: CommonMediaRequest) => Promise<any>
