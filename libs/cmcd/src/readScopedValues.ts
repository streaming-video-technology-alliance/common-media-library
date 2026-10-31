import { encodeSfDict, SfItem } from '@svta/cml-structured-field-values'
import { CMCD_KEY_SPECS } from './CMCD_KEY_SPECS.ts'
import { CMCD_V2 } from './CMCD_V2.ts'
import type { Cmcd } from './Cmcd.ts'
import { CMCD_EVENT_MODE } from './CmcdReportingMode.ts'
import { normalizeValue } from './normalizeValue.ts'
import { toBareValue } from './toBareValue.ts'
import { toTokenString } from './toTokenString.ts'

/**
 * The values of one call that every destination of a CMCD session receives.
 *
 * @internal
 */
export type CmcdScopedValues = {
	/**
	 * A valid `msd`, rounded to an integer.
	 */
	msd?: number

	/**
	 * The object type of a `bs: true` call. An empty string matches every object type.
	 */
	bs?: string

	/**
	 * A copy of the `bsd` items.
	 */
	bsd?: unknown[]

	/**
	 * A copy of the `ec` items.
	 */
	ec?: unknown[]
}

const MAX_INTEGER = 999_999_999_999_999

function copyItems(value: unknown, key: 'bsd' | 'ec'): unknown[] | undefined {
	if (value == null) {
		return undefined
	}

	const list = normalizeValue(toBareValue(value), CMCD_KEY_SPECS[key], {
		version: CMCD_V2,
		reportingMode: CMCD_EVENT_MODE,
	}) as unknown[] | undefined

	return list?.map(item =>
		item instanceof SfItem ? new SfItem(item.value, item.params && { ...item.params }) : item,
	)
}

/**
 * Reads the values of a call that have a destination scope.
 *
 * The result has a valid `msd`, the object type of a `bs: true` call, and copies of the `bsd` and `ec` items.
 *
 * @param data - The data of the call.
 * @param ec - The error codes of a `recordError()` call.
 * @returns The scoped values.
 *
 * @throws If a `bsd` or `ec` value cannot be encoded.
 *
 * @internal
 */
export function readScopedValues(data: Cmcd, ec?: readonly string[]): CmcdScopedValues {
	const scoped: CmcdScopedValues = {}
	const msd = toBareValue(data.msd)

	if (typeof msd === 'number' && msd >= 0 && Math.round(msd) <= MAX_INTEGER) {
		scoped.msd = Math.round(msd)
	}

	if (toBareValue(data.bs) === true) {
		scoped.bs = toTokenString(data.ot) ?? ''
	}

	const bsd = copyItems(data.bsd, 'bsd')
	const codes = copyItems(ec, 'ec')
	const lists: Record<string, unknown[]> = {}

	if (bsd) {
		lists['bsd'] = scoped.bsd = bsd
	}

	if (codes) {
		lists['ec'] = scoped.ec = codes
	}

	if (bsd || codes) {
		encodeSfDict(lists)
	}

	return scoped
}
