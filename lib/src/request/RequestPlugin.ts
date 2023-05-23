import { CommonMediaRequest } from './CommonMediaRequest.js';

/**
 * Request plugin API.
 * @param request - The request to be executed.
 * @returns A promise that is resolved when the plugin has completed the manipulation of the request.
 * In case the plugin takes in charge the execution of the request, it shall return a promise that is resolved with a 'true' boolean value.
 * 
 * @group Request
 */
export type RequestPlugin = (request: CommonMediaRequest) => Promise<boolean | void>
