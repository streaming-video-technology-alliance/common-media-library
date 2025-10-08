import type { CaptionScreen } from './CaptionScreen.js';

/**
 * A handler for CTA-608 cues.
 *
 * @beta
 */
export type CueHandler = {
	newCue(startTime: number, endTime: number, screen: CaptionScreen): void;
	reset?(): void;
	dispatchCue?(): void;
};
