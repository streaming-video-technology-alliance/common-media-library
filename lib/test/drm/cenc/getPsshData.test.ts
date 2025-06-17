import { getPsshData } from '@svta/common-media-library/drm/cenc/getPsshData.js';
import { strictEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { samplePsshBox } from '../common/samplePsshBox.ts';

describe('getPsshData', () => {
	it('should extract the data portion of the PSSH box', () => {
		//#region example
		const psshBuffer = new Uint8Array(samplePsshBox).buffer;
		const result = getPsshData(psshBuffer);
		//#endregion example
		strictEqual(result instanceof ArrayBuffer, true);
		strictEqual(result.byteLength, 0);
	});
});
