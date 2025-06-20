export const CMCD_MODE = {
	REQUEST: 'request',
	RESPONSE: 'response',
	EVENT: 'event',
} as const;

export type CmcdMode = ValueOf<typeof CMCD_MODE>;
