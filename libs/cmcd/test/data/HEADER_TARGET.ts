import type { CmcdReportTarget } from '@svta/cml-cmcd';
import { CmcdReportingMode, CmcdTransmissionMode } from '@svta/cml-cmcd';

export const HEADER_TARGET: CmcdReportTarget = {
	url: 'https://hello.world',
	version: 2,
	method: 'POST',
	reportingMode: CmcdReportingMode.REQUEST,
	transmissionMode: CmcdTransmissionMode.HEADERS,
};
