import type { DeepReadonly, HttpRequest } from '@svta/cml-utils'

/**
 * The media request handed to a report transform, as a read-only view.
 *
 * The request is context only. A transform reads it to decide what to do with
 * the report and must not mutate it: it belongs to the caller, which may still
 * be using it. Every member is `readonly`, and `customData` is readonly at
 * every depth, so nested values cannot be written either.
 *
 * By default `customData` values are `unknown` rather than `any`, because the
 * library cannot know the player's shape. Narrow with a cast or bracket access
 * to read player-specific fields:
 *
 * ```ts
 * transform: (data, request) =>
 * 	request?.customData?.['requestType'] === 'segment' ? data : null
 * ```
 *
 * Supply `C` to describe the player's own `customData` instead and those reads
 * become typed dot access. Annotating one transform is enough: the reporter
 * infers `C` for every other transform in the same configuration.
 *
 * ```ts
 * type PlayerData = { requestType: string; };
 *
 * const segmentsOnly: CmcdEventReportTransform<PlayerData> = (data, request) =>
 * 	request?.customData?.requestType === 'segment' ? data : null
 * ```
 *
 * `C` is applied through {@link DeepReadonly}, so describing a nested shape
 * does not trade the no-mutation guarantee for typed reads.
 *
 * Two limits are worth knowing. A mutable body such as `FormData` or
 * `URLSearchParams` has mutating methods of its own that no type can block, and
 * JavaScript callers get no enforcement at all. Mutating the request through
 * either route is unsupported, and the outgoing report may reflect it.
 *
 * @typeParam C - The shape of the player's `customData`. Defaults to
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
