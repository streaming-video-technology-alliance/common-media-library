import type { Cmcd } from './Cmcd.ts'

/**
 * The record `decorate()` puts on the returned request as `cmcd`. `data` is the report as sent.
 * The record object is the key that attributes a late response, so keep it on the request.
 *
 * @public
 */
export type CmcdRequestRecord = {
	readonly sid: string
	readonly data: Readonly<Cmcd>
}
