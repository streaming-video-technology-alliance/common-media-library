import type { Event } from './Event.ts'

export type EventStream = {
	schemeIdUri: string,
	timescale: number;
	events: Event[];
	presentationTimeOffset: number;
};
