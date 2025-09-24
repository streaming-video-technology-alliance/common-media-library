import type { ContainerBox } from './ContainerBox.js';
import type { IpmpInfoBox } from './IpmpInfoBox.js';
import type { OriginalFormatBox } from './OriginalFormatBox.js';
import type { SchemeInformationBox } from './SchemeInformationBox.js';
import type { SchemeTypeBox } from './SchemeTypeBox.js';

/**
 * Protection Scheme Information Box - 'sinf' - Container
 *
 * @group ISOBMFF
 *
 * @beta
 */
export type ProtectionSchemeInformationBox = ContainerBox<OriginalFormatBox | IpmpInfoBox | SchemeTypeBox | SchemeInformationBox> & {
	type: 'sinf';
};
