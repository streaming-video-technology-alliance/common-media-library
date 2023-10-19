/**
 * CMSD header fields.
 * 
 * @group CMSD
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
