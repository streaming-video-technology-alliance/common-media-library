import type { IpmpInfoBox } from './IpmpInfoBox.ts'
import type { OriginalFormatBox } from './OriginalFormatBox.ts'
import type { SchemeInformationBox } from './SchemeInformationBox.ts'
import type { SchemeTypeBox } from './SchemeTypeBox.ts'

/**
 * Child boxes of Protection Scheme Information Box
 *
 * @public
 */
export type ProtectionSchemeInformationBoxChild = OriginalFormatBox | IpmpInfoBox | SchemeTypeBox | SchemeInformationBox;

/**
 * Protection Scheme Information Box - 'sinf' - Container
 *
 * @public
 */
export type ProtectionSchemeInformationBox = {
	type: 'sinf';
	boxes: ProtectionSchemeInformationBoxChild[];
};

/**
 * @public
 */
export type sinf = ProtectionSchemeInformationBox;
