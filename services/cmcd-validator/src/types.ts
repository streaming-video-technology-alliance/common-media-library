import type { Cmcd } from '@svta/cml-cmcd'

/**
 * A recorded CMCD report from either a proxied request or an event POST.
 */
export type CmcdReport = {
	id: string;
	sessionId: string;
	type: 'request' | 'event';
	timestamp: string;
	data: Cmcd;
	targetId?: string;
	requestUrl?: string;
	method?: string;
	eventType?: string;
}

/**
 * Server configuration.
 */
export type ServerConfig = {
	port: number;
	dbPath: string;
}
