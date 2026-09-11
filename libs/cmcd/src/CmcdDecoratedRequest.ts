import type { CmcdRequestLike } from './CmcdRequestLike.ts'
import type { CmcdRequestRecord } from './CmcdRequestRecord.ts'

/**
 * The return type of `decorate()`. `url` carries the query parameter in query mode.
 * `headers` carries the `CMCD-` headers in header mode. Every other member of the input passes through.
 *
 * @public
 */
export type CmcdDecoratedRequest<R extends CmcdRequestLike> = Omit<R, 'url' | 'headers' | 'cmcd'> & {
	readonly url: string
	readonly headers?: Readonly<Record<string, string>>
	readonly cmcd: CmcdRequestRecord
}
