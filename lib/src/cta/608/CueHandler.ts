import type { CaptionScreen } from './CaptionScreen';

export interface CueHandler {
	newCue(startTime: number, endTime: number, screen: CaptionScreen): void;
	reset?(): void;
	dispatchCue?(): void;
}
