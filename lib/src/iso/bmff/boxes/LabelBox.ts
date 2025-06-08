import type { FullBox } from './FullBox.js';

/**
 * ISO/IEC 14496-12:202x - 8.10.5 Label box
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type LabelBox = FullBox & {
	type: 'labl';
	isGroupLabel: boolean;
	labelId: number;
	language: string;
	label: string;
};
