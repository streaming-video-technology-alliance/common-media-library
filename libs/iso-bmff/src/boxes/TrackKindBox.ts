import type { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:202x - 8.10.4 Track kind box
 *
 * @public
 */
export type TrackKindBox = FullBox & {
	type: 'kind';
	schemeUri: string;
	value: string;
};
