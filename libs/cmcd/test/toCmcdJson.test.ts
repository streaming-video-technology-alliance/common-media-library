import { toCmcdJson } from '@svta/cml-cmcd'
import { equal } from 'node:assert'
import { describe, it } from 'node:test'
import { CMCD_INPUT } from './data/CMCD_INPUT.ts'

describe('toCmcdJson', () => {
	it('produces json', () => {
		equal(toCmcdJson(CMCD_INPUT), '{"ab":2500,"bg":true,"bl":5000,"br":200,"bs":true,"bsd":2000,"cdn":"cdn-provider","cid":"content-id","com.example-exists":true,"com.example-hello":"world","com.example-quote":"\\"Quote\\"","com.example-testing":1234,"com.example-token":"s","cs":123456,"d":325,"df":5,"dl":10000,"ec":["ERR001","ERR002"],"lab":200,"lb":100,"ltc":1500,"msd":2500,"mtp":10000,"nor":["../testing/3.m4v"],"ot":"m","pb":1000,"pt":45000,"rtp":8000,"sf":"d","sid":"session-id","sn":1,"st":"v","sta":"p","su":true,"tab":3000,"tb":5000,"tbl":8000,"tpb":4000,"ts":1640995200000,"v":2}')
	})

	it('handles empty data', () => {
		equal(toCmcdJson(null as any), '{}')
	})
})
