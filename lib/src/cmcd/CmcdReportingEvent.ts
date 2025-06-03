/**
 * CMCD v2 event types for the 'e' key (event mode).
 * e: error, t: time interval, ps: play state change
 */
export const CMCD_REPORTING_EVENTS = {
	ERROR: 'e',
	TIME_INTERVAL: 't',
	PLAY_STATE: 'ps',
} as const;

export type CmcdReportingEvent = typeof CMCD_REPORTING_EVENTS[keyof typeof CMCD_REPORTING_EVENTS];
