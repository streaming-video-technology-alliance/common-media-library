/**
 * Retrieves the FairPlay license server URL from InitData.
 *
 * @param initData - The initialization data (PSSH box)
 * @returns The license server URL as a string
 *
 * @group DRM
 * @beta
 */

export function getLicenseServerUrl(initData: Uint16Array): string {
	let initDataString = '';
	for (let i = 0; i < initData.length; i++) {
		if (initData[i] !== 0) { // Ignore null characters
			initDataString += String.fromCharCode(initData[i]);
		}
	}

	const match = initDataString.match(/skd:\/\/([^"\s]+)/);
	return match ? `https://${match[1]}` : '';
}
