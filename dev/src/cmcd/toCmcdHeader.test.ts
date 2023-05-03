import { CmcdHeaderField, toCmcdHeaders } from '@svta.org/common-media-library';
import { deepEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { cmcdData } from './cmcdData.js';

const customHeaderMap = {
	['com.example-hello']: CmcdHeaderField.OBJECT,
	['com.example-token']: CmcdHeaderField.REQUEST,
	['com.example-testing']: CmcdHeaderField.SESSION,
	['com.example-exists']: CmcdHeaderField.STATUS,
};

describe('toCmcdHeader', () => {
	it('produces all shards', () => {
		deepEqual(toCmcdHeaders(cmcdData, { customHeaderMap }), {
			'CMCD-Object': 'br=200,com.example-hello="world",d=325,ot=m',
			'CMCD-Request': 'com.example-quote="\\"Quote\\"",com.example-token=s,mtp=10000,nor="..%2Ftesting%2F3.m4v",nrr="0-99"',
			'CMCD-Session': 'cid="content-id",com.example-testing=1234,sid="session-id"',
			'CMCD-Status': 'bs,com.example-exists',
		});
	});

	it('ignores empty shards', () => {
		deepEqual(toCmcdHeaders({ br: 200 }), {
			'CMCD-Object': 'br=200',
		});
	});

	it('handles null data object', () => {
		deepEqual(toCmcdHeaders(null as any), {});
	});
});
