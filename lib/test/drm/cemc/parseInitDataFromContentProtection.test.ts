import { parseInitDataFromContentProtection } from '@svta/common-media-library/drm/cemc/parseInitDataFromContentProtection';
import { beforeEach, describe, it } from 'node:test';
import { strictEqual } from 'node:assert';

describe('parseInitDataFromContentProtection', () => {
	let cpData: any;

	const base64Decode = (base64: string): ArrayBuffer => {
		const buffer = Buffer.from(base64, 'base64');
		return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
	};

	const BASE64 = {
		decodeArray: (input: string): Uint8Array => {
			return new Uint8Array(Buffer.from(input, 'base64'));
		},
	};

	beforeEach(() => {
		cpData = {
			pssh: {
				__text: 'AAAANHBzc2gAAAAA7e+LqXnWSs6jyCfc1R0h7QAAABQIARABGgZlbHV2aW8iBmVsdXZpbw==',
			},
			value: 'Widevine',
			schemeIdUri: 'urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed',
			KID: null,
		};
	});

	it('should return null if no init data is available in the ContentProtection element', () => {
		const result = parseInitDataFromContentProtection({}, BASE64);
		strictEqual(result, null);
	});

	it('should return base64 decoded buffer if init data is available', () => {
		//#region example
		const expected = base64Decode(cpData.pssh.__text);
		const result = parseInitDataFromContentProtection(cpData, BASE64);

		strictEqual(result?.byteLength, expected.byteLength);
		//#endregion example
	});

	it('should remove newlines and return base64 decoded buffer', () => {
		cpData.pssh.__text = '\n' + cpData.pssh.__text + '\n';
		const expected = base64Decode(cpData.pssh.__text.replace(/\s+/g, ''));
		const result = parseInitDataFromContentProtection(cpData, BASE64);

		strictEqual(result?.byteLength, expected.byteLength);
	});

	it('should remove whitespaces and return base64 decoded buffer', () => {
		cpData.pssh.__text = cpData.pssh.__text.slice(0, 20) + '   ' + cpData.pssh.__text.slice(20);
		const expected = base64Decode(cpData.pssh.__text.replace(/\s+/g, ''));
		const result = parseInitDataFromContentProtection(cpData, BASE64);

		strictEqual(result?.byteLength, expected.byteLength);
	});

	it('should remove whitespaces and newlines and return base64 decoded buffer', () => {
		cpData.pssh.__text = '\n\n' + cpData.pssh.__text.slice(0, 20) + '   ' + cpData.pssh.__text.slice(20) + '\n\n';
		const expected = base64Decode(cpData.pssh.__text.replace(/\s+/g, ''));
		const result = parseInitDataFromContentProtection(cpData, BASE64);

		strictEqual(result?.byteLength, expected.byteLength);
	});
});
