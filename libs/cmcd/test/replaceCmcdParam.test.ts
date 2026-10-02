import { equal } from 'node:assert'
import { describe, it } from 'node:test'
import { replaceCmcdParam } from '../src/replaceCmcdParam.ts'

describe('replaceCmcdParam', () => {
	it('adds the parameter to a URL without a query', () => {
		equal(replaceCmcdParam('https://cdn.test/1.m4s', 'sn=0'), 'https://cdn.test/1.m4s?CMCD=sn%3D0')
	})

	it('adds the parameter after the other parameters', () => {
		equal(replaceCmcdParam('https://cdn.test/1.m4s?a=1&b=2', 'sn=0'), 'https://cdn.test/1.m4s?a=1&b=2&CMCD=sn%3D0')
	})

	it('keeps the other parts of the URL byte for byte', () => {
		equal(replaceCmcdParam('https://CDN.test:443/a/./1.m4s?token=exp=1~acl=/*~hmac=ab&x=a%20b&flag', 'sn=0'), 'https://CDN.test:443/a/./1.m4s?token=exp=1~acl=/*~hmac=ab&x=a%20b&flag&CMCD=sn%3D0')
	})

	it('adds no separator to an empty query or after a trailing separator', () => {
		equal(replaceCmcdParam('https://cdn.test/1.m4s?', 'sn=0'), 'https://cdn.test/1.m4s?CMCD=sn%3D0')
		equal(replaceCmcdParam('https://cdn.test/1.m4s?a=1&', 'sn=0'), 'https://cdn.test/1.m4s?a=1&CMCD=sn%3D0')
	})

	it('replaces the first CMCD parameter in place and removes the others', () => {
		equal(replaceCmcdParam('https://cdn.test/1.m4s?CMCD=sn%3D1&a=1&CMCD=sn%3D2', 'sn=3'), 'https://cdn.test/1.m4s?CMCD=sn%3D3&a=1')
		equal(replaceCmcdParam('https://cdn.test/1.m4s?a=1&CMCD&b=2', 'sn=3'), 'https://cdn.test/1.m4s?a=1&CMCD=sn%3D3&b=2')
	})

	it('keeps the fragment at the end', () => {
		equal(replaceCmcdParam('https://cdn.test/1.m4s?a=1#t=10', 'sn=0'), 'https://cdn.test/1.m4s?a=1&CMCD=sn%3D0#t=10')
		equal(replaceCmcdParam('https://cdn.test/1.m4s#t=10', 'sn=0'), 'https://cdn.test/1.m4s?CMCD=sn%3D0#t=10')
	})

	it('does not read a query in the fragment', () => {
		equal(replaceCmcdParam('https://cdn.test/1.m4s#x?CMCD=old', 'sn=0'), 'https://cdn.test/1.m4s?CMCD=sn%3D0#x?CMCD=old')
	})

	it('accepts a relative URL', () => {
		equal(replaceCmcdParam('seg/1.m4s?CMCD=old', 'sn=0'), 'seg/1.m4s?CMCD=sn%3D0')
	})

	it('only removes the parameter when the value is empty', () => {
		equal(replaceCmcdParam('https://cdn.test/1.m4s?CMCD=sn%3D1'), 'https://cdn.test/1.m4s')
		equal(replaceCmcdParam('https://cdn.test/1.m4s?CMCD=sn%3D1&a=1#t', ''), 'https://cdn.test/1.m4s?a=1#t')
		equal(replaceCmcdParam('https://cdn.test/1.m4s?a=1'), 'https://cdn.test/1.m4s?a=1')
	})

	it('reads a CMCD parameter name with percent-encoding', () => {
		equal(replaceCmcdParam('https://cdn.test/1.m4s?%43MCD=old&a=1', 'sn=0'), 'https://cdn.test/1.m4s?CMCD=sn%3D0&a=1')
		equal(replaceCmcdParam('https://cdn.test/1.m4s?a=1&CMC%44'), 'https://cdn.test/1.m4s?a=1')
	})

	it('keeps a parameter whose name does not decode to CMCD', () => {
		equal(replaceCmcdParam('https://cdn.test/1.m4s?%ZZ=1&%43MCDX=2', 'sn=0'), 'https://cdn.test/1.m4s?%ZZ=1&%43MCDX=2&CMCD=sn%3D0')
	})

	it('keeps a parameter whose name only contains CMCD', () => {
		equal(replaceCmcdParam('https://cdn.test/1.m4s?XCMCD=1&CMCDX=2&cmcd=3'), 'https://cdn.test/1.m4s?XCMCD=1&CMCDX=2&cmcd=3')
		equal(replaceCmcdParam('https://cdn.test/1.m4s?XCMCD=1', 'sn=0'), 'https://cdn.test/1.m4s?XCMCD=1&CMCD=sn%3D0')
	})

	it('encodes the value as the CTA-5004-B examples do', () => {
		equal(replaceCmcdParam('https://cdn.test/1.m4s', 'bl=(5000),ot=v,sid="s 1"'), 'https://cdn.test/1.m4s?CMCD=bl%3D%285000%29%2Cot%3Dv%2Csid%3D%22s%201%22')
	})
})
