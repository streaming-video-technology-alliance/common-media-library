import { CmcdReportingMode, CmcdTransmissionMode, toCmcdReport } from '@svta/common-media-library/cmcd';
import { deepEqual, equal } from 'node:assert';
import { describe, it } from 'node:test';
import { QUERY_TARGET } from './data/QUERY_TARGET.ts';

describe('toCmcdReport', () => {
	it('provides a valid example', () => {
		//#region example
		const data = {
			br: 1000,
			'com.example-hello': 'world',
			ec: ['ERR001', 'ERR002'],
			su: true,
			ts: 0,
		};

		const headerRequestReport = toCmcdReport(data, {
			url: 'https://hello.world/',
			version: 2,
			method: 'POST',
			reportingMode: CmcdReportingMode.REQUEST,
			transmissionMode: CmcdTransmissionMode.HEADERS,
		});

		deepEqual(headerRequestReport, {
			url: 'https://hello.world/',
			method: 'POST',
			headers: {
				'CMCD-Object': 'br=1000',
				'CMCD-Request': 'com.example-hello="world",su,ts=0',
				'CMCD-Session': 'v=2',
				'CMCD-Status': 'ec=("ERR001" "ERR002")',
			},
		});

		const queryResponseReport = toCmcdReport(data, {
			url: 'https://hello.world',
			version: 1,
			reportingMode: CmcdReportingMode.RESPONSE,
			transmissionMode: CmcdTransmissionMode.QUERY,
		});

		deepEqual(queryResponseReport, {
			url: 'https://hello.world/?CMCD=br%3D1000%2Ccom.example-hello%3D%22world%22%2Csu%2Cts%3D0',
			method: 'GET',
			headers: {},
		});
		//#endregion example
	});

	it('handles null data object', () => {
		deepEqual(toCmcdReport(null as any, QUERY_TARGET), {
			headers: {},
			method: 'GET',
			url: 'https://hello.world/',
		});
	});

	it('handles null target object', () => {
		equal(toCmcdReport({}, null as any), null);
	});

	it('returns encoded query string', () => {
		// equal(toCmcdQuery(CMCD_INPUT), CMCD_QUERY);
	});

	it('handles null data object', () => {
		// equal(toCmcdQuery(null as any), '');
	});

	it('returns encoded query string', () => {
		// equal(toCmcdQuery(CMCD_INPUT), CMCD_QUERY);
	});
});
