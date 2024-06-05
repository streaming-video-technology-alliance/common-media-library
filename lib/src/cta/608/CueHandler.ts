import type { CaptionScreen } from './CaptionScreen';

/**
 * A handler for CTA-608 cues.
 *
 * @group CTA-608
 * @beta
 */
export interface CueHandler {
	newCue(startTime: number, endTime: number, screen: CaptionScreen): void;
	reset?(): void;
	dispatchCue?(): void;
}
