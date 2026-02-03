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
		//#region example
		deepEqual(decodeCmcd('br=1000,com.example-hello="world",ec=("ERR001" "ERR002"),su'), {
			br: 1000,
			'com.example-hello': 'world',
			ec: ['ERR001', 'ERR002'],
			su: true,
		})
		//#endregion example
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
})
