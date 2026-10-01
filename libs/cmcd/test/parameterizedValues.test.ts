import type { Cmcd, CmcdDecodeOptions } from '@svta/cml-cmcd'
import { CmcdEventType, CmcdReporter, decodeCmcd, encodeCmcd, toCmcdHeaders, validateCmcd } from '@svta/cml-cmcd'
import { SfItem } from '@svta/cml-structured-field-values'
import type { HttpRequest } from '@svta/cml-utils'
import { deepEqual, equal, ok } from 'node:assert'
import { describe, it } from 'node:test'

const NUMERIC_LIST_KEYS = ['ab', 'bl', 'br', 'bsa', 'bsd', 'bsda', 'lab', 'lb', 'mtp', 'pb', 'tab', 'tb', 'tbl', 'tpb'] as const
const VERSION_1_KEYS: readonly string[] = ['bl', 'br', 'mtp', 'tb']

function decodeToRecord(input: string, options?: CmcdDecodeOptions): Record<string, unknown> {
	return decodeCmcd(input, options) as unknown as Record<string, unknown>
}

function errorsOf(input: string): string[] {
	return validateCmcd(decodeToRecord(input)).issues
		.filter(issue => issue.severity === 'error')
		.map(issue => issue.message)
}

function hasMember(input: string, member: string): boolean {
	return Object.values(toCmcdHeaders(decodeCmcd(input) as Cmcd)).some(value => value.includes(member))
}

function bareList(value: unknown): unknown[] {
	ok(value instanceof SfItem, 'expected an SfItem that wraps a list')
	const list = value.value as unknown
	ok(Array.isArray(list), 'expected a list inside the SfItem')
	return list.map(item => item instanceof SfItem ? item.value : item)
}

function decodedBr(input: string): Cmcd['br'] {
	return (decodeCmcd(input) as Cmcd).br
}

function createMockRequester() {
	const requests: HttpRequest[] = []

	const requester = async (request: HttpRequest): Promise<{ status: number; }> => {
		requests.push(request)
		return { status: 200 }
	}

	return { requester, requests }
}

const REPORT_KEYS = ['br', 'ec', 'sid', 'v', 'e', 'ts', 'sn'] as const

describe('values with parameters', () => {
	it('provides a valid example', () => {
		// #region example
		const data = decodeCmcd('br=(3000 6000);p=2,v=2', { convertToLatest: true })
		equal(encodeCmcd(data), 'br=(3000 6000);p=2,v=2')
		equal(validateCmcd(data as unknown as Record<string, unknown>).valid, true)
		// #endregion example
	})

	for (const key of NUMERIC_LIST_KEYS) {
		describe(key, () => {
			const member = `${key}=(1200 3400);p=2`
			const input = `${member},v=2`

			it('returns the input after a decode and encode round trip', () => {
				equal(encodeCmcd(decodeCmcd(input, { useSymbol: false }) as Cmcd), input)
			})

			it('sends the first value in version 1, or omits a key that version 1 does not have', () => {
				equal(encodeCmcd(decodeCmcd(input) as Cmcd, { version: 1 }), VERSION_1_KEYS.includes(key) ? `${key}=1200` : '')
			})

			it('puts the member in a header', () => {
				ok(hasMember(input, member))
			})

			it('passes validation', () => {
				deepEqual(errorsOf(input), [])
			})

			it('keeps the list when a payload without v is converted to version 2', () => {
				const data = decodeToRecord(member, { convertToLatest: true })
				deepEqual(bareList(data[key]), [1200, 3400])
				deepEqual((data[key] as SfItem).params, { p: 2 })
			})
		})
	}

	describe('nor', () => {
		const member = 'nor=("a.m4s";r="0-99" "b.m4s");p=2'
		const input = `${member},v=2`

		it('returns the input after a decode and encode round trip', () => {
			equal(encodeCmcd(decodeCmcd(input, { useSymbol: false }) as Cmcd), input)
		})

		it('sends the first path and its range in version 1', () => {
			equal(encodeCmcd(decodeCmcd(input) as Cmcd, { version: 1 }), 'nor="a.m4s",nrr="0-99"')
		})

		it('puts the member in a header', () => {
			ok(hasMember(input, member))
		})

		it('passes validation', () => {
			deepEqual(errorsOf(input), [])
		})
	})

	describe('ec', () => {
		const member = 'ec=("E1" "E2");p=2'
		const input = `${member},v=2`

		it('returns the input after a decode and encode round trip', () => {
			equal(encodeCmcd(decodeCmcd(input, { useSymbol: false }) as Cmcd), input)
		})

		it('omits the key in version 1', () => {
			equal(encodeCmcd(decodeCmcd(input) as Cmcd, { version: 1 }), '')
		})

		it('puts the member in a header', () => {
			ok(hasMember(input, member))
		})

		it('passes validation', () => {
			deepEqual(errorsOf(input), [])
		})
	})

	describe('single values', () => {
		it('validates the value inside an SfItem', () => {
			deepEqual(errorsOf('d=1200;x,ot=v,v=2'), [])
			deepEqual(errorsOf('sid="abc";x,v=2'), [])
			deepEqual(errorsOf('com.example-id="abc";x,v=2'), [])
		})

		it('reads v inside an SfItem', () => {
			deepEqual(errorsOf('br=(1200),v=2;x'), [])
		})

		it('reports a wrong value inside an SfItem', () => {
			ok(errorsOf('d=12.5;x,ot=v,v=2').includes('Key "d" must be a finite integer.'))
			ok(errorsOf('br=(1200.5);p=2,v=2').includes('Key "br" array element [0] must be a finite integer.'))
		})

		it('keeps a version 2 payload unchanged when v has parameters', () => {
			const data = decodeToRecord('br=(1200);p=2,v=2;x', { convertToLatest: true })
			deepEqual(bareList(data['br']), [1200])
		})
	})

	describe('CmcdReporter', () => {
		it('sends a br list with parameters in a request report', () => {
			const { requester } = createMockRequester()
			const reporter = new CmcdReporter({ sid: 'test-session', enabledKeys: ['br'] }, requester)

			reporter.update({ br: decodedBr('br=(3000 6000);p=2') })

			const report = reporter.createRequestReport({ url: 'https://example.com/segment.m4s' })
			const sent = decodeToRecord(new URL(report.url).searchParams.get('CMCD') ?? '')
			deepEqual(bareList(sent['br']), [3000, 6000])
			deepEqual((sent['br'] as SfItem).params, { p: 2 })
		})

		it('fires one BITRATE_CHANGE event for two equal br lists with parameters', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 'test-session',
				enabledKeys: [...REPORT_KEYS],
				eventTargets: [{
					url: 'https://example.com/cmcd',
					events: [CmcdEventType.BITRATE_CHANGE],
					enabledKeys: [...REPORT_KEYS],
					batchSize: 1,
				}],
			}, requester)

			reporter.update({ br: decodedBr('br=(3000 6000);p=2') })
			reporter.update({ br: decodedBr('br=(3000 6000);p=2') })
			reporter.update({ br: decodedBr('br=(3000 6000);p=3') })

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 2)
		})

		it('keeps the stored br list when a transform changes the list in its report', async () => {
			const { requester, requests } = createMockRequester()
			const reporter = new CmcdReporter({
				sid: 'test-session',
				enabledKeys: [...REPORT_KEYS],
				eventTargets: [{
					url: 'https://example.com/cmcd',
					events: [CmcdEventType.ERROR],
					enabledKeys: [...REPORT_KEYS],
					batchSize: 1,
					transform: (data) => {
						const br = data.br as unknown
						if (br instanceof SfItem) {
							(br.value as unknown as SfItem[]).push(new SfItem(9900))
						}
						return data
					},
				}],
			}, requester)

			reporter.update({ br: decodedBr('br=(3000 6000);p=2') })
			reporter.recordEvent(CmcdEventType.ERROR)
			reporter.recordEvent(CmcdEventType.ERROR)

			await new Promise(resolve => setTimeout(resolve, 10))

			equal(requests.length, 2)
			ok((requests[1].body as string).includes('br=(3000 6000 9900);p=2'))
		})
	})
})
