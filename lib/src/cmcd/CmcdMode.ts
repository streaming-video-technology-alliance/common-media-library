export const CMCD_MODE = {
	REQUEST: 'request',
	RESPONSE: 'response',
	EVENT: 'event',
} as const;

export type CmcdMode = typeof CMCD_MODE[keyof typeof CMCD_MODE];
