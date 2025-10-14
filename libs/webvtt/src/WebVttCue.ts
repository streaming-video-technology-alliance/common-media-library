import type { WebVttRegion } from './WebVttRegion.ts'

/**
 * A WebVTT cue.
 *
 *
 * @beta
 */
export type WebVttCue = {
	id: string;
	startTime: number;
	endTime: number;
	pauseOnExit: boolean;
	text: string;
	align: AlignSetting;
	region: WebVttRegion | null;
	vertical: DirectionSetting;
	snapToLines: boolean;
	line: LineAndPositionSetting;
	lineAlign: LineAlignSetting;
	position: LineAndPositionSetting;
	positionAlign: PositionAlignSetting;
	size: number;
};
