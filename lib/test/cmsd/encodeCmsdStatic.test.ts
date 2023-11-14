import { CmsdObjectType } from '@svta/common-media-library/cmsd/CmsdObjectType';
import { CmsdStreamType } from '@svta/common-media-library/cmsd/CmsdStreamType';
import { CmsdStreamingFormat } from '@svta/common-media-library/cmsd/CmsdStreamingFormat';
import { encodeCmsdStatic } from '@svta/common-media-library/cmsd/encodeCmsdStatic';
import { SfToken } from '@svta/common-media-library/structuredfield/SfToken';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';
import { CMSD_STATIC_OBJ } from './data/CMSD_STATIC_OBJ.js';
import { CMSD_STATIC_STRING } from './data/CMSD_STATIC_STRING.js';

describe('encodeCmsdStatic', () => {
	it('handles null value object', () => {
		// @ts-expect-error
		equal(encodeCmsdStatic(null), '');
	});

	it('returns encoded string', () => {
		equal(encodeCmsdStatic(CMSD_STATIC_OBJ), CMSD_STATIC_STRING);
	});

	it('returns encoded string when SfToken is used', () => {
		const input = Object.assign({}, CMSD_STATIC_OBJ, {
			ot: new SfToken(CmsdObjectType.VIDEO),
			sf: new SfToken(CmsdStreamingFormat.HLS),
			st: new SfToken(CmsdStreamType.VOD),
		});
		equal(encodeCmsdStatic(input), CMSD_STATIC_STRING);
	});
});
