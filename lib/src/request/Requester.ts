import type { CommonMediaRequest } from './CommonMediaRequest.js';
import type { CommonMediaResponse } from './CommonMediaResponse.js';

/**
 * A function that executes a request and returns a response that adhere to the
 * common media request/response types.
 *
 * @group Request
 *
 * @beta
 */
export type Requester = (request: CommonMediaRequest) => Promise<CommonMediaResponse>;
