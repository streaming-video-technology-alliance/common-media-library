import type { DeepReadonly, HttpRequest } from '@svta/cml-utils'

/**
 * The media request passed to a report transform, as a read-only view.
 *
 * The request is context only. A transform reads it to decide what to do with
 * the report. A transform must not mutate the request, which belongs to the
 * caller and may still be in use. Every member is `readonly`, and `customData`
 * is readonly at every depth, so nested values cannot be written either.
 *
 * By default `customData` values are `unknown` rather than `any`, because the
 * library cannot know the player's fields. Narrow with a cast or bracket access
 * to read player-specific fields:
 *
 * ```ts
 * transform: (data, request) =>
 * 	request?.customData?.['requestType'] === 'segment' ? data : null
 * ```
 *
 * Supply `C` to describe the player's own `customData` instead, and those
 * reads become typed dot access. Annotating one transform is enough: the
 * reporter infers `C` for every other transform in the same configuration.
 *
 * ```ts
 * type PlayerData = { requestType: string; };
 *
 * const segmentsOnly: CmcdEventReportTransform<PlayerData> = (data, request) =>
 * 	request?.customData?.requestType === 'segment' ? data : null
 * ```
 *
 * This type wraps `C` in {@link DeepReadonly}, so a nested `C` keeps both the
 * read-only guarantee and typed reads.
 *
 * Two limits apply. A mutable body such as `FormData` or `URLSearchParams`
 * has mutating methods of its own that no type can block. JavaScript callers
 * get no enforcement at all. Both kinds of mutation are unsupported, and the
 * outgoing report may reflect them.
 *
 * @typeParam C - The type of the player's `customData`. Defaults to
 *                `Record<string, unknown>`.
 *
 * @public
 */
export type CmcdTransformRequest<C = Record<string, unknown>> = Readonly<Omit<HttpRequest, 'customData' | 'headers'>> & {
	/**
	 * The headers associated with the request.
	 */
	readonly headers?: Readonly<Record<string, string>>;

	/**
	 * Any custom data the caller attached to the request, including the
	 * player's own fields.
	 */
	readonly customData?: DeepReadonly<C>;
};
