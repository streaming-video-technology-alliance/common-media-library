import { toQuery } from '@svta.org/common-media-library/cmcd/toQuery';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';
import { data } from './data.js';

describe('CMCD Query serialization', () => {
	it('handles null data object', () => {
		equal(toQuery(null as any), '');
	});

	it('returns encoded query string', () => {
		equal(toQuery(data), 'CMCD=br%3D200%2Cbs%2Ccid%3D%22content-id%22%2Ccom.example-exists%2Ccom.example-hello%3D%22world%22%2Ccom.example-quote%3D%22%5C%22Quote%5C%22%22%2Ccom.example-testing%3D1234%2Ccom.example-token%3Ds%2Cd%3D325%2Cmtp%3D10049%2Cnor%3D%22..%252Ftesting%252F3.m4v%22%2Cnrr%3D%220-99%22%2Cot%3Dm%2Csid%3D%22session-id%22');
	});

	it('populates the URLSearchParams object if provided', () => {
		const searchParams = new URLSearchParams();
		const results = toQuery(data, { searchParams });
		const expected = 'br=200,bs,cid="content-id",com.example-exists,com.example-hello="world",com.example-quote="\\"Quote\\"",com.example-testing=1234,com.example-token=s,d=325,mtp=10049,nor="..%2Ftesting%2F3.m4v",nrr="0-99",ot=m,sid="session-id"';
		equal(results, expected);
		equal(searchParams.get('CMCD'), expected);
	});
});