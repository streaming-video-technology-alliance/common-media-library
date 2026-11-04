import type { HttpRequester } from '@svta/cml-utils'

/**
 * A function that sends a Steering Manifest request.
 *
 * The returned promise must settle. A response without `status` counts as
 * status 200. `url` is the URI after redirects. `data` is a string or a
 * plain object of parsed JSON. In `headers`, a header name matches in any
 * case. A cross-origin Retry-After header needs the response header
 * `Access-Control-Expose-Headers`.
 *
 * `fetchRequester` from `@svta/cml-utils` is a requester that uses `fetch`.
 * A `Requester` function from `@svta/cml-request` has a compatible type.
 *
 * @public
 */
export type SteeringRequester = HttpRequester
