import type { Cmcd } from '@svta/cml-cmcd'

/**
 * A recorded CMCD report from either a proxied request or an event POST.
 */
export interface CmcdReport {
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
export interface ServerConfig {
	port: number;
	upstream: string;
	dbPath: string;
}
