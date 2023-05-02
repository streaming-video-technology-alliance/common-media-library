import { encodeCmcd } from '@svta.org/common-media-library/cmcd/encodeCmcd';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';
import { data } from './data.js';

describe('CMCD encoding', () => {
	it('handles null data object', () => {
		equal(encodeCmcd(null as any), '');
	});

	it('returns encoded string', () => {
		equal(encodeCmcd(data), 'br=200,bs,cid="content-id",com.example-exists,com.example-hello="world",com.example-quote="\\"Quote\\"",com.example-testing=1234,com.example-token=s,d=325,mtp=10000,nor="..%2Ftesting%2F3.m4v",nrr="0-99",ot=m,sid="session-id"');
	});
});
