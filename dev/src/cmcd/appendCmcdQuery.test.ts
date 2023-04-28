import { appendCmcdQuery } from '@svta.org/common-media-library';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';

describe('CMCD appendToUrl', () => {
	const url = 'https://test.com';
	const data = {
		br: 1000,
	};

	it('handles null data object', () => {
		equal(appendCmcdQuery(null as any, url), url);
	});

	it('add ? when query does not exist', () => {
		equal(appendCmcdQuery(data, url), `${url}?CMCD=br%3D1000`);
	});

	it('add & when query does exist', () => {
		equal(appendCmcdQuery(data, `${url}?hello=world`), `${url}?hello=world&CMCD=br%3D1000`);
	});
});
