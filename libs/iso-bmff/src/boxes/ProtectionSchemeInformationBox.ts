import type { ContainerBox } from './ContainerBox.ts'
import type { IpmpInfoBox } from './IpmpInfoBox.ts'
import type { OriginalFormatBox } from './OriginalFormatBox.ts'
import type { SchemeInformationBox } from './SchemeInformationBox.ts'
import type { SchemeTypeBox } from './SchemeTypeBox.ts'

/**
 * Protection Scheme Information Box - 'sinf' - Container
 *
 * @public
 */
export type ProtectionSchemeInformationBox = ContainerBox<OriginalFormatBox | IpmpInfoBox | SchemeTypeBox | SchemeInformationBox> & {
	type: 'sinf';
};

/**
 * @public
 */
export type sinf = ProtectionSchemeInformationBox;
