import type { Cmcd } from '@svta/cml-cmcd'

/**
 * A recorded CMCD report from an event POST.
 */
export type CmcdReport = {
	id: string;
	sessionId: string;
	type: 'event';
	timestamp: string;
	data: Cmcd;
	targetId?: string;
	eventType?: string;
}

/**
 * Server configuration.
 */
export type ServerConfig = {
	port: number;
	dbPath: string;
}
