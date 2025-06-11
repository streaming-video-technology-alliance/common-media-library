/**
 * CMCD v2 event types for the 'e' key (event mode).
 */


export const CMCD_REPORTING_EVENTS = {
	PLAY_STATE: 'ps',
	ERROR: 'e',
	TIME_INTERVAL: 't',
	CONTENT_ID: 'c',
	BACKGROUNDED_MODE: 'b',
	MUTE: 'm',
	UNMUTE: 'um',
	PLAYER_EXPAND: 'pe',
	PLAYER_COLLAPSE: 'pc',
} as const;

export type CmcdReportingEvent = typeof CMCD_REPORTING_EVENTS[keyof typeof CMCD_REPORTING_EVENTS];
