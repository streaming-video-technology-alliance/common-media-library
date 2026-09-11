/**
 * One row of the key table. `requiredOn` is `'always'` or an event type.
 * `v1` says what version 1 does with the key. `absent` drops it.
 * `scalar` collapses an object-type list to one number. `string` keeps the first `nor` entry.
 */
export type CmcdKeySpec = {
	readonly type: 'boolean' | 'integer' | 'decimal' | 'string' | 'token' | 'string-list' | 'ot-list' | 'nor' | 'custom'
	readonly modes: 'both' | 'event'
	readonly round?: number
	readonly ot?: readonly string[]
	readonly supersededBy?: string
	readonly onlyOn?: string
	readonly requiredOn?: string
	readonly omitDefault?: boolean | number
	readonly max?: number
	readonly v1?: 'absent' | 'scalar' | 'string'
	readonly tokens?: readonly string[]
}
