// NOTE: String enum values cannot be "computed", so we need to redefine them here.
// import { CMSD_DYNAMIC } from './CMSD_DYNAMIC.js';
// import { CMSD_STATIC } from './CMSD_STATIC.js';

/**
 * CMSD header fields.
 *
 * @group CMSD
 *
 * @beta
 */
export enum CmsdHeaderField {
	/**
	 * Keys whose values persist over multiple requests for the object.
	 */
	STATIC = 'CMSD-Static',

	/**
	 * Keys whose values apply only to the next transmission hop. Typically a
	 * new CMSD-Dynamic header instance will be added by each intermediary
	 * participating in the delivery.
	 */
	DYNAMIC = 'CMSD-Dynamic',
}
