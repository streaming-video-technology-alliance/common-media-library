import type { CmcdHeadersMap } from '@svta/common-media-library';
import { CmcdHeaderField } from '@svta/common-media-library/cmcd/CmcdHeaderField';
import { toCmcdHeaders } from '@svta/common-media-library/cmcd/toCmcdHeaders';
import { deepEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { CMCD_HEADERS } from './data/CMCD_HEADERS.ts';
import { CMCD_INPUT } from './data/CMCD_INPUT.ts';

const customHeaderMap: CmcdHeadersMap = {
	[CmcdHeaderField.OBJECT]: ['com.example-hello'],
	[CmcdHeaderField.REQUEST]: ['com.example-token'],
	[CmcdHeaderField.SESSION]: ['com.example-testing'],
	[CmcdHeaderField.STATUS]: ['com.example-exists'],
};

describe('toCmcdHeaders', () => {
	it('produces all shards', () => {
		deepEqual(toCmcdHeaders(CMCD_INPUT, { customHeaderMap }), CMCD_HEADERS);
	});

	it('ignores empty shards', () => {
		deepEqual(toCmcdHeaders({ br: 200, pb: 1000 }), {
			'CMCD-Object': 'br=200',
			'CMCD-Request': 'pb=1000',
		});
	});

	it('handles null data object', () => {
		deepEqual(toCmcdHeaders(null as any), {});
	});
});
