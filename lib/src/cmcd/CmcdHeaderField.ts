/**
 * CMCD header fields.
 *
 * @group CMCD
 *
 * @beta
 */
export enum CmcdHeaderField {
	/**
	 * keys whose values vary with the object being requested.
	 */
	OBJECT = 'CMCD-Object',

	/**
	 * keys whose values vary with each request.
	 */
	REQUEST = 'CMCD-Request',

	/**
	 * keys whose values are expected to be invariant over the life of the session.
	 */
	SESSION = 'CMCD-Session',

	/**
	 * keys whose values do not vary with every request or object.
	 */
	STATUS = 'CMCD-Status',
}
