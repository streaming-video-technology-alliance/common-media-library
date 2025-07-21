import type { CmcdCustomKey } from '@svta/common-media-library/cmcd/CmcdCustomKey';
import { CmcdHeaderField } from '@svta/common-media-library/cmcd/CmcdHeaderField';
import type { CmcdHeaderMap } from '@svta/common-media-library/cmcd/CmcdHeaderMap';
import { CmcdReportingMode } from '@svta/common-media-library/cmcd/CmcdReportingMode';
import { toCmcdHeaders } from '@svta/common-media-library/cmcd/toCmcdHeaders';
import { deepEqual, equal } from 'node:assert';
import { describe, it } from 'node:test';
import { CMCD_HEADERS } from './data/CMCD_HEADERS.ts';
import { CMCD_INPUT } from './data/CMCD_INPUT.ts';

const customHeaderMap: CmcdHeaderMap = {
	[CmcdHeaderField.OBJECT]: ['com.example-hello'],
	[CmcdHeaderField.REQUEST]: ['com.example-token'],
	[CmcdHeaderField.SESSION]: ['com.example-testing'],
	[CmcdHeaderField.STATUS]: ['com.example-exists'],
};

describe('toCmcdHeaders', () => {
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
			customHeaderMap: {
				[CmcdHeaderField.OBJECT]: ['com.example-hello' as CmcdCustomKey],
			},
		};

		deepEqual(toCmcdHeaders(data, options), {
			'CMCD-Object': 'br=1000,com.example-hello="world"',
			'CMCD-Request': 'su',
			'CMCD-Session': 'v=2',
			'CMCD-Status': 'ec=("ERR001" "ERR002")',
		});
		//#endregion example
	});

	it('produces all shards', () => {
		deepEqual(toCmcdHeaders(CMCD_INPUT, { customHeaderMap }), CMCD_HEADERS);
	});

	it('ignores empty shards', () => {
		let headers = toCmcdHeaders({ br: 200, pb: 1000 }, { version: 1 });

		deepEqual(headers, {
			'CMCD-Object': 'br=200',
		});

		equal(headers['CMCD-Request'], undefined);
		equal(headers['CMCD-Session'], undefined);
		equal(headers['CMCD-Status'], undefined);

		headers = toCmcdHeaders({ br: 200, pb: 1000 }, { version: 2 });

		deepEqual(headers, {
			'CMCD-Object': 'br=200',
			'CMCD-Request': 'pb=1000',
			'CMCD-Session': 'v=2',
		});

		equal(headers['CMCD-Status'], undefined);
	});

	it('handles null data object', () => {
		deepEqual(toCmcdHeaders(null as any), {});
	});
});
