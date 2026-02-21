import { CMCD_V2 } from './CMCD_V2.ts'
import type { CmcdData } from './CmcdData.ts'
import type { CmcdV2Data } from './CmcdData.ts'

/**
 * Check if a CMCD data object is version 2.
 *
 * @param data - The CMCD data object to check.
 *
 * @returns `true` if the data is version 2, `false` otherwise.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/isCmcdV2Data.test.ts#example}
 */
export function isCmcdV2Data(data: CmcdData): data is CmcdV2Data {
	return data.v === CMCD_V2
}
