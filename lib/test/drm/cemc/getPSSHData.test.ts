import { getPSSHData } from '@svta/common-media-library/drm/cemc/getPSSHData';
import { strictEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { samplePsshBox } from '../common/samplePsshBox';

describe('getPSSHData', () => {
	it('should extract the data portion of the PSSH box', () => {
		//#region example
		const psshBuffer = new Uint8Array(samplePsshBox).buffer;
		const result = getPSSHData(psshBuffer);
		//#endregion example
		strictEqual(result instanceof ArrayBuffer, true);
		strictEqual(result.byteLength, 0);
	});
});
