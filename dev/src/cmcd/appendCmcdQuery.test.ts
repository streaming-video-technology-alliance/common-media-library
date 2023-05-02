import { appendCmcdQuery } from '@svta.org/common-media-library';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';

describe('CMCD appendToUrl', () => {
	const url = 'https://test.com';
	const data = {
		br: 1000,
	};

	it('handles null data object', () => {
		equal(appendCmcdQuery(url, null as any), url);
	});

	it('add ? when query does not exist', () => {
		equal(appendCmcdQuery(url, data), `${url}?CMCD=br%3D1000`);
	});

	it('add & when query does exist', () => {
		equal(appendCmcdQuery(`${url}?hello=world`, data), `${url}?hello=world&CMCD=br%3D1000`);
	});
});
