/**
 * CMAF-HAM Event type
 *
 * @alpha
 */
export type Event = {
	messageData: string;
	duration: number;
	id: string;
	presentationTime: number;
	adjustedPresentationTime?: number;
	schemeIdUri: string;
};
