import type { KeySystem } from '../common/KeySystem';
import { parsePSSHList } from './parsePSSHList.ts';

/**
 * Returns the PSSH box associated with the given key system from the concatenated
 * list of PSSH boxes in the provided initData.
 *
 * @param keySystem - The desired key system
 * @param initData - 'cenc' initialization data. Concatenated list of PSSH boxes.
 * @returns The PSSH box ArrayBuffer corresponding to the given key system, or null if not found.
 *
 * @group DRM
 * @beta
 *
 * @example
 * {@includeCode ../../../test/drm/cenc/getPSSHForKeySystem.test.ts#example}
 */
export function getPSSHForKeySystem(
	keySystem: KeySystem | null | undefined,
	initData: ArrayBuffer | null | undefined,
): ArrayBuffer | null {
	if (!initData || !keySystem) {
		return null;
	}

	const psshList = parsePSSHList(initData);
	const uuid = keySystem.uuid.toLowerCase();

	if (Object.prototype.hasOwnProperty.call(psshList, keySystem.uuid.toLowerCase())) {
		return psshList[uuid];
	}

	return null;
}
