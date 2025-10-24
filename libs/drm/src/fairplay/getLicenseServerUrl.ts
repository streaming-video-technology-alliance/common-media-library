/**
 * Retrieves the FairPlay license server URL from InitData.
 *
 * @param initData - The initialization data (PSSH box)
 * @returns The license server URL as a string
 *
 * @beta
 *
 * @example
 * {@includeCode ../../test/fairplay/getLicenseServerUrl.test.ts#example}
 */

export function getLicenseServerUrl(initData: Uint16Array): string {
	let initDataString = ''
	for (const code of initData) {
		if (code !== 0) { // Ignore null characters
			initDataString += String.fromCharCode(code)
		}
	}

	const match = initDataString.match(/skd:\/\/([^"\s]+)/)
	return match ? `https://${match[1]}` : ''
}
