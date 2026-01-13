import type { Event } from './Event.ts'

/**
 * CMAF-HAM Event Stream type
 *
 * @alpha
 */
export type EventStream = {
	schemeIdUri: string,
	timescale: number;
	events: Event[];
	presentationTimeOffset: number;
};
