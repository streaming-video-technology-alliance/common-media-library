import { fromCmcdHeaders } from '@svta/cml-cmcd';
import { deepEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { CMCD_HEADERS } from './data/CMCD_HEADERS.ts';
import { CMCD_OUTPUT } from './data/CMCD_OUTPUT.ts';

describe('fromCmcdHeaders', () => {
	it('provides a valid example', () => {
		//#region example
		const headers = {
			'CMCD-Object': 'br=200',
			'CMCD-Status': 'ec=("ERR001" "ERR002"),pt=45000,rtp=8000',
			'CMCD-Request': 'su',
			'CMCD-Session': 'v=2',
		};

		deepEqual(fromCmcdHeaders(headers), {
			br: 200,
			ec: ['ERR001', 'ERR002'],
			pt: 45000,
			rtp: 8000,
			su: true,
			v: 2,
		});
		//#endregion example
	});

	it('produces CMCD object', () => {
		deepEqual(fromCmcdHeaders(CMCD_HEADERS), CMCD_OUTPUT);
	});
});
