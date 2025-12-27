import type { FullBox } from './FullBox.ts'

/**
 * ISO/IEC 14496-12:2012 - 8.12.5 Scheme Type Box
 *
 * @public
 */
export type SchemeTypeBox = FullBox & {
	type: 'schm';
	schemeType: number;
	schemeVersion: number;
	schemeUri?: string;
};
