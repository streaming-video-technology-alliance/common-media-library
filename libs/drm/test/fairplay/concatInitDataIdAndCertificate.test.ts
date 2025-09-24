import { concatInitDataIdAndCertificate } from '@svta/cml-drm/fairplay/concatInitDataIdAndCertificate';
import { base64decode } from '@svta/cml-utils/base64decode';
import { convertUint8ToUint16 } from '@svta/cml-utils/convertUint8ToUint16';
import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'node:test';

// initData and CKC appCertData from Apple's FairPlay example
const mockInitDataBase64 = `AAAAAgAAAACIiMWpQhMDI6pMnx2nfIiIMoaz9xQolnPlrBsRFKyANk3mGrJ0R1rb476dlbP7gfY5RHrSdUdvEMIMIbCl3hrGj96RIuGb4MDZqIWAo2FGwODnjP7FqW00fMY9kWRiTPngKU3dY3agBnZ8glOEskarDrEQak`;
const mockAppCertDataBase64 = `AAAAAQAAAACt1bxIOvg1vAIIGMHiRWJ+AAAB8AK5R4nipOTa0/xTM8wCdT3LnZV2knbPIhjUkPBalO9vOjZsqRL8EuFzMy8vhfThzSdS/faGZIdj6Izki7v8K85nBNm6PWqwYjKGilecApnwEwBMIQFXh2ihWECoNe1AMDG7BMXgxW7xxt2K9gm4NlSif4uHlASElGAoev0As3CJy3t11DLeVm/B6aKyga0NJ8o2ujeTtjlKtaa7aPT1JQHA8nIdHnfrEFoK8P9melrtn0/CZiMaPYu9W+NF2woOOKuIf3Z2GvIkh4evSlQcSLysoSTxt4xKRyyG87WRrbFhBR1U7ZIsqQfodWLCtJ++/RsUsrjOscml7fqJ1auyMZWflkARsCOQumAz61bWw1oGjWcnbsshnckOBq/wBG6ZZgw7tBaed/gx33PLkNKfnIDNvGU210W9O9ZYPan0A6t8b5DgUlCWvs1JdE08Kw0yLEelvnfPTXJEgoGuD6vpKnCHG9JpAZOWEKbnnrYMnPAMwbKHiOIehb85mJQ7N5nFUCM5oLc01uO8HbB13sxhq+OxrwiSjqBRqEzZj2GXDbc+50I80LjMnboZDSB+EeUn0dHp4yWOr2FG0KQaqLgUs3F6Ylmey9Rf5IilL7f1/YkSl3pea/w+Qi4VcDYTj+2tqOT6gnDmrv5jNJ2uUsViR/g=`;

const initData = convertUint8ToUint16(base64decode(mockInitDataBase64));
const appCertData = base64decode(mockAppCertDataBase64);
const contentId = convertUint8ToUint16(new TextEncoder().encode('skd://svta.com/content1234'));

describe('concatInitDataIdAndCertificate', () => {
	it('concatenates initData, id, and certificate correctly', () => {
		//#region example
		const result = concatInitDataIdAndCertificate(initData, contentId, appCertData);

		// It should be 8-bit integer type and contain data
		deepStrictEqual(result instanceof Uint8Array, true);
		deepStrictEqual(result.length > 0, true);
		//#endregion example
	});

	it('handles empty certificate and id correctly', () => {
		const id = '';
		const cert = new Uint8Array([]);
		const result = concatInitDataIdAndCertificate(initData, id, cert);

		// Length should account for added ID and cert size
		deepStrictEqual(result.length, initData.byteLength + 4 + 4);
	});
});
