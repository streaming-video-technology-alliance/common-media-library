import { createCmcdSession } from '@svta/cml-cmcd'
import { equal } from 'node:assert'
import { describe, it } from 'node:test'

describe('createCmcdSession', () => {
	it('provides a valid example', () => {
		// #region example
		const session = createCmcdSession({
			keys: ['br', 'bl', 'd', 'ot', 'sid', 'cid', 'mtp', 'sf', 'st', 'su', 'nor'],
		})
		const reporter = session.createReporter({ cid: 'movie-42' })
		reporter.update({ sf: 'h', st: 'v', sta: 'p', bl: 3200, mtp: 15000 })
		const req = reporter.decorate({ url: 'https://cdn.example.com/seg-1.m4s' }, { ot: 'v', d: 4000, br: 3000 })
		// req.url carries the CMCD query parameter, req.cmcd.data is the report as sent
		session.dispose()
		// #endregion example
		equal(req.url.includes('CMCD='), true)
	})
})
