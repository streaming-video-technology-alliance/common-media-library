import { isEmpty } from '../utils/isEmpty.js';

/**
 * Retrieves the FairPlay license server URL from InitData or DRM configuration.
 *
 * @param initData - The initialization data (PSSH box)
 * @param drmConfig - The DRM configuration containing the license URL
 * @returns The license server URL as a string
 *
 * @group DRM
 * @beta
 */

export function getLicenseServerUrl(initData: Uint16Array, drmConfig: { licenseUrl?: string; }): string {
	if (!isEmpty(drmConfig.licenseUrl) && drmConfig.licenseUrl?.startsWith('http')) {
		return drmConfig.licenseUrl;
	}

	let initDataString = '';
	for (let i = 0; i < initData.length; i++) {
		if (initData[i] !== 0) { // Ignore null characters
			initDataString += String.fromCharCode(initData[i]);
		}
	}

	const match = initDataString.match(/skd:\/\/([^"\s]+)/);
	return match ? `https://${match[1]}` : '';
}
