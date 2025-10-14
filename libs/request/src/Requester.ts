import type { CommonMediaRequest } from './CommonMediaRequest.ts';
import type { CommonMediaResponse } from './CommonMediaResponse.ts';

/**
 * A function that executes a request and returns a response that adhere to the
 * common media request/response types.
 *
 *
 * @beta
 */
export type Requester = (request: CommonMediaRequest) => Promise<CommonMediaResponse>;
