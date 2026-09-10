import { CmcdTransmissionMode, createCmcdSession } from '@svta/cml-cmcd'
import { deepEqual, equal, throws } from 'node:assert'
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

	it('uses a UUID when no sid is given', () => {
		const session = createCmcdSession()
		equal(/^[0-9a-f-]{36}$/.test(session.sid), true)
		equal(createCmcdSession({ sid: 'given' }).sid, 'given')
	})

	it('rejects invalid configuration with an actionable message', () => {
		const long = 'x'.repeat(65)
		throws(() => createCmcdSession({ sid: long }), { message: `CmcdSession: sid must be a string of at most 64 characters, received ${long}` })
		throws(() => createCmcdSession().createReporter({ cid: 'y'.repeat(129) }), { message: /^CmcdSession: cid must be a string of at most 128 characters/ })
		throws(() => createCmcdSession({ keys: ['br', 'nope' as never] }), { message: 'CmcdSession: keys must be reserved keys or hyphenated custom keys, received nope' })
		throws(() => createCmcdSession({ transmissionMode: 'json' }), { message: 'CmcdSession: transmissionMode must be query or headers, received json' })
		throws(() => createCmcdSession({ version: 3 as never }), { message: 'CmcdSession: version must be 1 or 2, received 3' })
		throws(() => createCmcdSession({ eventTargets: [{ url: '' }] }), { message: 'CmcdSession: eventTargets[0].url must be a non-empty string, received ' })
		throws(() => createCmcdSession({ eventTargets: [{ url: 'https://c.example', events: ['zz' as never] }] }), { message: 'CmcdSession: eventTargets[0].events must be event types, received zz' })
		throws(() => createCmcdSession({ eventTargets: [{ url: 'https://c.example', interval: -1 }] }), { message: 'CmcdSession: eventTargets[0].interval must be a finite number of seconds, 0 or more, received -1' })
		throws(() => createCmcdSession({ eventTargets: [{ url: 'https://c.example', batchSize: 0 }] }), { message: 'CmcdSession: eventTargets[0].batchSize must be a positive integer, received 0' })
		throws(() => createCmcdSession({ eventTargets: [{ url: 'https://c.example', batchSize: 1000 }] }), { message: 'CmcdSession: eventTargets[0].batchSize must be at most maxQueueSize (500), received 1000' })
		throws(() => createCmcdSession({ eventTargets: [{ url: 'https://c.example', maxQueueSize: 2.5 }] }), { message: 'CmcdSession: eventTargets[0].maxQueueSize must be a positive integer, received 2.5' })
		throws(() => createCmcdSession({ eventTargets: [{ url: 'https://c.example', version: 2 } as never] }), { message: 'CmcdSession: eventTargets[0].version must be absent, event mode is version 2, received 2' })
	})

	it('configure() replaces the request settings and keeps the counters', () => {
		const session = createCmcdSession({ sid: 's', keys: ['sid', 'sn'] })
		const reporter = session.createReporter()
		reporter.decorate({ url: 'https://cdn.example.com/a' })
		session.configure({ transmissionMode: CmcdTransmissionMode.HEADERS, keys: ['sid', 'sn', 'ot'] })
		const req = reporter.decorate({ url: 'https://cdn.example.com/b' }, { ot: 'v' })
		equal(req.url, 'https://cdn.example.com/b')
		deepEqual(req.headers, { 'CMCD-Object': 'ot=v', 'CMCD-Request': 'sn=1', 'CMCD-Session': 'sid="s",v=2' })
		throws(() => session.configure({ keys: ['bad key' as never] }), { message: 'CmcdSession: keys must be reserved keys or hyphenated custom keys, received bad key' })
	})
})
