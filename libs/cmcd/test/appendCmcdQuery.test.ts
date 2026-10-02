import { appendCmcdQuery } from '@svta/cml-cmcd'
import { equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('appendCmcdQuery', () => {
	const url = 'https://test.com'
	const data = {
		br: [1000],
	}

	it('provides a valid example', () => {
		//#region example
		const url = 'https://test.com'
		const data = {
			br: [1000],
		}

		equal(appendCmcdQuery(url, data), `${url}?CMCD=br%3D%281000%29%2Cv%3D2`)
		equal(appendCmcdQuery(`${url}?hello=world`, data), `${url}?hello=world&CMCD=br%3D%281000%29%2Cv%3D2`)
		//#endregion example
	})

	it('handles null data object', () => {
		equal(appendCmcdQuery(url, null as any), url)
	})

	it('returns the URL unchanged when the data has no keys to send', () => {
		equal(appendCmcdQuery(url, {}), url)
		equal(appendCmcdQuery(`${url}?CMCD=su`, {}), `${url}?CMCD=su`)
	})

	it('add ? when query does not exist', () => {
		equal(appendCmcdQuery(url, data), `${url}?CMCD=br%3D%281000%29%2Cv%3D2`)
	})

	it('add & when query does exist', () => {
		equal(appendCmcdQuery(`${url}?hello=world`, data), `${url}?hello=world&CMCD=br%3D%281000%29%2Cv%3D2`)
	})

	it('replaces CMCD param if it already exists', () => {
		equal(appendCmcdQuery(`${url}?CMCD=su`, data), `${url}?CMCD=br%3D%281000%29%2Cv%3D2`)
		equal(appendCmcdQuery(`${url}?CMCD=sf%3Dh&hello=world`, data), `${url}?CMCD=br%3D%281000%29%2Cv%3D2&hello=world`)
		equal(appendCmcdQuery(`${url}?hello=world&CMCD=sf%3Dh`, data), `${url}?hello=world&CMCD=br%3D%281000%29%2Cv%3D2`)
		equal(appendCmcdQuery(`${url}?CMCD=su#test`, data), `${url}?CMCD=br%3D%281000%29%2Cv%3D2#test`)
	})

	it('removes the other CMCD params', () => {
		equal(appendCmcdQuery(`${url}?CMCD=su&hello=world&CMCD=bs`, data), `${url}?CMCD=br%3D%281000%29%2Cv%3D2&hello=world`)
	})

	it('adds the param before the fragment', () => {
		equal(appendCmcdQuery(`${url}/1.m4s#t=10`, data), `${url}/1.m4s?CMCD=br%3D%281000%29%2Cv%3D2#t=10`)
		equal(appendCmcdQuery(`${url}/1.m4s?hello=world#t=10`, data), `${url}/1.m4s?hello=world&CMCD=br%3D%281000%29%2Cv%3D2#t=10`)
	})

	it('reads only the CMCD param of the query', () => {
		equal(appendCmcdQuery(`${url}?XCMCD=keep`, data), `${url}?XCMCD=keep&CMCD=br%3D%281000%29%2Cv%3D2`)
		equal(appendCmcdQuery(`${url}/CMCD=1/seg.m4s`, data), `${url}/CMCD=1/seg.m4s?CMCD=br%3D%281000%29%2Cv%3D2`)
	})
})
