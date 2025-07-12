import { CmcdReportingMode, CmcdTransmissionMode, type CmcdReportTarget } from '@svta/common-media-library/cmcd';

export const QUERY_TARGET: CmcdReportTarget = {
	url: 'https://hello.world',
	version: 2,
	reportingMode: CmcdReportingMode.RESPONSE,
	transmissionMode: CmcdTransmissionMode.QUERY,
};
