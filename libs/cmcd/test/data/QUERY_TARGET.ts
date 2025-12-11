import { CmcdReportingMode, CmcdTransmissionMode, type CmcdReportTarget } from '@svta/cml-cmcd'

export const QUERY_TARGET: CmcdReportTarget = {
	url: 'https://hello.world',
	version: 2,
	reportingMode: CmcdReportingMode.EVENT,
	transmissionMode: CmcdTransmissionMode.QUERY,
}
