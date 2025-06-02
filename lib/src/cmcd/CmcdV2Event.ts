import type { CmcdReportingEvent } from './CmcdReportingEvent';

/**
 * CMCD v2 - Event and Event-Response keys.
 */
export type CmcdV2Event = {
	/** Reporting event (event mode; e.g. "e", "t", "ps") */
	e?: CmcdReportingEvent;
};
