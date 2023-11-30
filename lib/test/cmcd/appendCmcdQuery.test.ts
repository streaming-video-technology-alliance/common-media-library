import { appendCmcdQuery } from '@svta/common-media-library';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';

describe('appendCmcdQuery', () => {
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

	it('replaces CMCD param if it already exists', () => {
		equal(appendCmcdQuery(`${url}?CMCD=su`, data), `${url}?CMCD=br%3D1000`);
		equal(appendCmcdQuery(`${url}?CMCD=sf%3Dh&hello=world`, data), `${url}?CMCD=br%3D1000&hello=world`);
		equal(appendCmcdQuery(`${url}?hello=world&CMCD=sf%3Dh`, data), `${url}?hello=world&CMCD=br%3D1000`);
		equal(appendCmcdQuery(`${url}?CMCD=su#test`, data), `${url}?CMCD=br%3D1000#test`);
	});
});
