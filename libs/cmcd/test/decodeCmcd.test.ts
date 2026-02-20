import { decodeCmcd } from '@svta/cml-cmcd'
import { deepEqual } from 'node:assert'
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
