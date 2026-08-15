import type { Cmcd } from '@svta/cml-cmcd'
import { decodeCmcd, encodeCmcd } from '@svta/cml-cmcd'
import { SfItem, SfToken } from '@svta/cml-structured-field-values'
import { deepEqual, equal } from 'node:assert'
import { describe, it } from 'node:test'
import { CMCD_OUTPUT_REQUEST } from './data/CMCD_OUTPUT_REQUEST.ts'
import { CMCD_STRING_REQUEST } from './data/CMCD_STRING_REQUEST.ts'

describe('decodeCmcd', () => {
	it('provides a valid example', () => {
		//#region example
		deepEqual(decodeCmcd('br=(1000),com.example-hello="world",ec=("ERR001" "ERR002"),su,v=2'), {
			br: [1000],
			'com.example-hello': 'world',
			ec: ['ERR001', 'ERR002'],
			su: true,
			v: 2,
		})
		//#endregion example
	})

	it('version 1', () => {
		deepEqual(decodeCmcd('br=1000,com.example-hello="world",ec=("ERR001" "ERR002"),su'), {
			br: 1000,
			'com.example-hello': 'world',
			ec: ['ERR001', 'ERR002'],
			su: true,
		})
	})

	it('preserves params on a dictionary member', () => {
		deepEqual(decodeCmcd('com.example-x=1;p=2'), {
			'com.example-x': new SfItem(1, { p: 2 }),
		})
	})

	it('preserves params on an inner list', () => {
		deepEqual(decodeCmcd('tab=(3000);p=2'), {
			tab: new SfItem([3000], { p: 2 }),
		})
	})

	it('reduces the value inside a params-bearing item', () => {
		// The inner token reduces to a string exactly as a bare member's
		// value would; only the params-bearing wrapper is retained.
		deepEqual(decodeCmcd('com.example-y=(bar;p=1)'), {
			'com.example-y': [new SfItem('bar', { p: 1 })],
		})
	})

	it('decodes tokens as SfToken with useSymbol: false', () => {
		deepEqual(decodeCmcd('com.example-tok=abc,ot=v', { useSymbol: false }), {
			'com.example-tok': new SfToken('abc'),
			ot: new SfToken('v'),
		})
	})

	it('decodes tokens as registry symbols with useSymbol: true', () => {
		deepEqual(decodeCmcd('com.example-tok=abc,ot=v', { useSymbol: true }), {
			'com.example-tok': Symbol.for('abc'),
			ot: Symbol.for('v'),
		})
	})

	it('round-trips wire bytes through decode and encode', () => {
		// Token preservation plus params preservation make the codec
		// symmetric: with tokens reduced to strings (the default), a
		// custom-key token would re-encode quoted.
		const s = 'br=(3000;ot=v 6000),com.example-tok=abc,com.example-x=1;p=2,ot=v,su,tab=(3000);p=2,v=2'

		equal(encodeCmcd(decodeCmcd(s, { useSymbol: false }) as Cmcd), s)
		equal(encodeCmcd(decodeCmcd(s, { useSymbol: true }) as Cmcd), s)
	})

	it('handles null data object', () => {
		deepEqual(decodeCmcd(null as any), {})
	})

	it('handles empty string', () => {
		deepEqual(decodeCmcd(''), {})
	})

	it('returns encoded string', () => {
		deepEqual(decodeCmcd(CMCD_STRING_REQUEST), CMCD_OUTPUT_REQUEST)
	})

	it('up-converts v1 scalars to v2 arrays with convertToLatest', () => {
		deepEqual(decodeCmcd('bl=2000,br=3000,mtp=5000,tb=6000', { convertToLatest: true }), {
			bl: [2000],
			br: [3000],
			mtp: [5000],
			tb: [6000],
		})
	})

	it('up-converts v1 nor string to array with convertToLatest', () => {
		deepEqual(decodeCmcd('nor="../next.m4s"', { convertToLatest: true }), {
			nor: ['../next.m4s'],
		})
	})

	it('does not modify v2 data with convertToLatest', () => {
		deepEqual(decodeCmcd('br=(1000),su,v=2', { convertToLatest: true }), {
			br: [1000],
			su: true,
			v: 2,
		})
	})

	it('preserves non-list keys with convertToLatest', () => {
		deepEqual(decodeCmcd('bl=2000,sid="abc",su', { convertToLatest: true }), {
			bl: [2000],
			sid: 'abc',
			su: true,
		})
	})
})
