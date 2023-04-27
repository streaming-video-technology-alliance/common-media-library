import { encodeCmcd } from '@svta.org/common-media-library/cmcd/encodeCmcd';
import { equal, throws } from 'node:assert';
import { describe, it } from 'node:test';
import { data } from './data.js';

describe('CMCD encoding', () => {
	it('handles null data object', () => {
		throws(() => encodeCmcd(null as any));
	});

	it('returns encoded query string', () => {
		equal(encodeCmcd(data), decodeURIComponent('br=200,bs,cid="content-id",com.example-exists,com.example-hello="world",com.example-quote="\\"Quote\\"",com.example-testing=1234,com.example-token=s,d=324.69,mtp=10049,nor="../testing/3.m4v",nrr="0-99",ot=m,sid="session-id"'));
	});
});
