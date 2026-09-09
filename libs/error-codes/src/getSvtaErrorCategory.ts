import { SvtaErrorCategory } from './SvtaErrorCategory.ts'

/**
 * Get the `SvtaErrorCategory` of an SVTA error code, per the spec's
 * `code / 1000` rule.
 *
 * @param code - An SVTA error code.
 * @returns The error category. Returns `undefined` if the code is not a
 * non-negative integer, or if the spec does not assign its category.
 * Categories 8-98 and above 99 are reserved for future use.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/getSvtaErrorCategory.test.ts#example}
 */
export function getSvtaErrorCategory(code: number): SvtaErrorCategory | undefined {
	if (!Number.isInteger(code)) {
		return undefined
	}

	const category = Math.floor(code / 1000)

	if ((category >= SvtaErrorCategory.UNKNOWN && category <= SvtaErrorCategory.ADVERTISING) || category === SvtaErrorCategory.CUSTOM) {
		return category as SvtaErrorCategory
	}

	return undefined
}
