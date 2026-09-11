/**
 * The shape `decorate()` and `recordResponse()` accept: a URL and optional headers.
 *
 * @public
 */
export type CmcdRequestLike = {
	readonly url: string
	readonly headers?: Readonly<Record<string, string>>
}
