import { CmsdDynamicParams } from './CmsdDynamicParams';

/**
 * Common Media Server Data (CMSD) dynamic response header fields.
 *
 * @see {@link https://cdn.cta.tech/cta/media/media/resources/standards/pdfs/cta-5006-final.pdf|CMSD Spec}
 *
 * @group CMSD
 *
 * @beta
 */
export interface CmsdDynamic {
	/**
	 * The server name.
	 */
	value: string;

	/**
	 * The CMSD dynamic parameters.
	 */
	params: CmsdDynamicParams
}
