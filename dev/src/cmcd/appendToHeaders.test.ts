import { appendToHeaders } from '@svta.org/common-media-library/cmcd/appendToHeaders';
import { deepEqual } from 'node:assert';
import { describe, it } from 'node:test';

describe('CMCD appendToHeaders', () => {
	const headers = {
		hello: 'world',
	};

	const data = {
		br: 1000,
	};

	it('handles null data object', () => {
		deepEqual(appendToHeaders(headers, null as any), headers);
	});

	it('appends headers', () => {
		deepEqual(appendToHeaders(headers, data), {
			...headers,
			['CMCD-Object']: 'br=1000',
		});
	});
});
