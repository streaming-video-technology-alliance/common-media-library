import { parsePsshList } from './parsePsshList.ts'

/**
 * Returns the PSSH box associated with the given key system from the concatenated
 * list of PSSH boxes in the provided initData.
 *
 * @param uuid - The desired key system UUID
 * @param initData - 'cenc' initialization data. Concatenated list of PSSH boxes.
 * @returns The PSSH box ArrayBuffer corresponding to the given key system, or null if not found.
 *
 * @public
 *
 * @example
 * {@includeCode ../../test/cenc/getPsshForKeySystem.test.ts#example}
 */
export function getPsshForKeySystem(
	uuid: string,
	initData: ArrayBuffer,
): ArrayBuffer | null {
	if (!initData || !uuid) {
		return null
	}

	const psshList = parsePsshList(initData)
	return psshList[uuid.toLowerCase()] || null
}
