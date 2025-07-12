import type { CmcdReportTarget } from '@svta/common-media-library/cmcd';
import { CmcdReportingMode, CmcdTransmissionMode } from '@svta/common-media-library/cmcd';

export const HEADER_TARGET: CmcdReportTarget = {
	url: 'https://hello.world',
	version: 2,
	method: 'POST',
	reportingMode: CmcdReportingMode.REQUEST,
	transmissionMode: CmcdTransmissionMode.HEADERS,
};
