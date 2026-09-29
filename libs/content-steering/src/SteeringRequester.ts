import type { HttpRequest, HttpResponse } from '@svta/cml-utils'

/**
 * A function that sends a Steering Manifest request.
 *
 * A `Requester` function from `@svta/cml-request` has a compatible type.
 *
 *
 * @beta
 */
export type SteeringRequester = (request: HttpRequest) => Promise<HttpResponse>;
