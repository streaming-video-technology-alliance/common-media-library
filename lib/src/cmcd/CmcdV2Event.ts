import type { CmcdReportingEvent } from './CmcdReportingEvent';

export const CMCD_V2_EVENT_MODE_KEYS = [
	'e',
] as const;

/**
 * CMCD v2 - Event and Event-Response keys.
 */
export type CmcdV2Event = {
	/** Reporting event (event mode; e.g. "e", "t", "ps") */
	e?: CmcdReportingEvent;
};
