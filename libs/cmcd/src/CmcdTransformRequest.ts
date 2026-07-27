import type { HttpRequest } from '@svta/cml-utils'

/**
 * The media request handed to a report transform, as a read-only view.
 *
 * The request is context only. A transform reads it to decide what to do with
 * the report and must not mutate it: it belongs to the caller, which may still
 * be using it. Every member is `readonly`, and `customData` is an opaque record
 * so nested values cannot be written either.
 *
 * `customData` values are `unknown` rather than `any` because the library
 * cannot know the player's shape. Narrow with a cast or bracket access to read
 * player-specific fields:
 *
 * ```ts
 * transform: (data, request) =>
 * 	request?.customData?.['requestType'] === 'segment' ? data : null
 * ```
 *
 * Two limits are worth knowing. A mutable body such as `FormData` or
 * `URLSearchParams` has mutating methods of its own that no type can block, and
 * JavaScript callers get no enforcement at all. Mutating the request through
 * either route is unsupported, and the outgoing report may reflect it.
 *
 * @public
 */
export type CmcdTransformRequest = Readonly<Omit<HttpRequest, 'customData' | 'headers'>> & {
	/**
	 * The headers associated with the request.
	 */
	readonly headers?: Readonly<Record<string, string>>;

	/**
	 * Any custom data the caller attached to the request, including the
	 * player's own fields.
	 */
	readonly customData?: Readonly<Record<string, unknown>>;
};
