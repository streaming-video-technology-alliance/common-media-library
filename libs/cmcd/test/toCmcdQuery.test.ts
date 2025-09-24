import { CmcdReportingMode, toCmcdQuery } from '@svta/cml-cmcd';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';
import { CMCD_INPUT } from './data/CMCD_INPUT.ts';
import { CMCD_QUERY } from './data/CMCD_QUERY.ts';

describe('toCmcdQuery', () => {
	it('provides a valid example', () => {
		//#region example
		const data = {
			br: 1000,
			'com.example-hello': 'world',
			ec: ['ERR001', 'ERR002'],
			su: true,
		};

		const options = {
			version: 2,
			reportingMode: CmcdReportingMode.REQUEST,
		};

		equal(toCmcdQuery(data, options), 'CMCD=br%3D1000%2Ccom.example-hello%3D%22world%22%2Cec%3D(%22ERR001%22%20%22ERR002%22)%2Csu%2Cv%3D2');
		//#endregion example
	});

	it('handles null data object', () => {
		equal(toCmcdQuery(null as any), '');
	});

	it('returns encoded query string', () => {
		equal(toCmcdQuery(CMCD_INPUT), CMCD_QUERY);
	});
});
