import type { CmcdReportingMode } from './CmcdReportingMode.js';

/**
 * Options for formatting CMCD data values.
 *
 * @group CMCD
 *
 * @beta
 */
export type CmcdFormatterOptions = {
	version: number;
	reportingMode: CmcdReportingMode;
	baseUrl?: string;
};
