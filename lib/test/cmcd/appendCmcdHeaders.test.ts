import { appendCmcdHeaders } from '@svta.org/common-media-library';
import { deepEqual } from 'node:assert';
import { describe, it } from 'node:test';

describe('appendCmcdHeaders', () => {
	const headers = {
		hello: 'world',
	};

	const data = {
		br: 1000,
	};

	it('handles null data object', () => {
		deepEqual(appendCmcdHeaders(headers, null as any), headers);
	});

	it('appends headers', () => {
		deepEqual(appendCmcdHeaders(headers, data), {
			...headers,
			['CMCD-Object']: 'br=1000',
		});
	});
});
