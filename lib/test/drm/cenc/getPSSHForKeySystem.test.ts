import { getPSSHForKeySystem, WIDEVINE_KEY_SYSTEM } from '@svta/common-media-library/drm.js';
import { strictEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { samplePsshBox } from '../common/samplePsshBox.ts';

describe('getPSSHForKeySystem', () => {
	// sample keySystem UUID. It matches the systemId in the
	// samplePsshBox in the common folder.
	const keySystem: { uuid: string, systemString: string } = {
		uuid: '1077efec-c0b2-4d02-ace3-3c1e52e2fb4b',
		systemString: WIDEVINE_KEY_SYSTEM,
	};

	it('should return the correct PSSH box for the given key system', () => {
		//#region example
		const initData = new Uint8Array(samplePsshBox).buffer;
		const result = getPSSHForKeySystem(keySystem, initData);
		//#endregion example

		strictEqual(result?.byteLength, samplePsshBox.length);
	});

	it('should return null if key system does not match', () => {
		const initData = new Uint8Array(samplePsshBox).buffer;
		const result = getPSSHForKeySystem({
			uuid: '00000000-0000-0000-0000-000000000000',
			systemString: WIDEVINE_KEY_SYSTEM,
		}, initData);

		strictEqual(result, null);
	});

	it('should return null if no initData is provided', () => {
		const result = getPSSHForKeySystem(keySystem, null);

		strictEqual(result, null);
	});

	it('should return null if no keySystem is provided', () => {
		const initData = new Uint8Array(samplePsshBox).buffer;
		const result = getPSSHForKeySystem(null, initData);

		strictEqual(result, null);
	});
});
