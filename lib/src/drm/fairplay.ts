import { decodeQueryString } from './utils/decodeQueryString';
import { stringToArray } from './utils/stringToArray';
import { isEmpty } from './utils/isEmpty';
import { base64decode } from '../utils/base64decode';

/**
 * Concatenates InitData, ID, and Certificate for FairPlay DRM.
 *
 * @param initData - The initialization data (PSSH box)
 * @param id - The content ID (string or Uint16Array)
 * @param cert - The application certificate (Uint8Array)
 * @returns A Uint8Array containing the concatenated data
 *
 * @group DRM
 * @beta
 */
export function concatInitDataIdAndCertificate(initData: Uint16Array, id: Uint16Array | string, cert: Uint8Array): Uint8Array {
	if (typeof id === 'string') {
		id = stringToArray(id);
	}
	const buffer = new ArrayBuffer(initData.byteLength + 4 + id.byteLength + 4 + cert.byteLength);
	const dataView = new DataView(buffer);
	let offset = 0;

	new Uint8Array(buffer, offset, initData.byteLength).set(initData);
	offset += initData.byteLength;

	dataView.setUint32(offset, id.byteLength, true);
	offset += 4;
	new Uint16Array(buffer, offset, id.length).set(id);
	offset += id.byteLength;

	dataView.setUint32(offset, cert.byteLength, true);
	offset += 4;
	new Uint8Array(buffer, offset, cert.byteLength).set(cert);

	return new Uint8Array(buffer);
}

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
export function getLicenseServerUrl(initData: Uint16Array, drmConfig: { licenseUrl?: string }): string {
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

/**
 * Decodes a FairPlay DRM license response.
 *
 * @param response - The license response, either a base64 string or ArrayBuffer
 * @returns A Uint8Array containing the decoded license
 *
 * @group DRM
 * @beta
 */
export function decodeFairPlayLicense(response: string | ArrayBuffer): Uint8Array {
	return typeof response === 'string'
		? base64decode(response)
		: new Uint8Array(response);
}

/**
 * Extracts the content ID from the license server URL or InitData.
 *
 * @param licenseServerUrl - The license server URL
 * @param initData - The initialization data (PSSH box)
 * @param queryParam - The query parameter key to extract (default: 'ContentId')
 * @returns The extracted content ID as a string or null if not found
 *
 * @group DRM
 * @beta
 */
export function getId(licenseServerUrl: string, initData: Uint16Array, queryParam: string = 'ContentId'): string | null {
	const obj = decodeQueryString(licenseServerUrl);
	return obj[queryParam] || extractContentId(initData, queryParam);
}

/**
 * Extracts the content ID from InitData using skd:// URI or query parameters.
 *
 * @param initData - The initialization data (PSSH box)
 * @param queryParam - The query parameter key to extract (default: 'ContentId')
 * @returns The extracted content ID as a string or null if not found
 *
 * @group DRM
 * @beta
 */
function extractContentId(initData: Uint16Array, queryParam: string = 'ContentId'): string | null {
	const initDataString = new TextDecoder().decode(initData);

	// Try skd:// approach first
	const skdMatch = initDataString.match(/skd:\/\/([^"\s]+)/);
	if (skdMatch) {
		return skdMatch[1];
	}

	// If not skd://, then try extracting from query params
	const queryMatch = new RegExp(`${queryParam}=([^&\\s]+)`).exec(initDataString);
	return queryMatch ? queryMatch[1] : null;
}
