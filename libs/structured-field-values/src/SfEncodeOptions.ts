/**
 * Options for encoding a structured field.
 *
 * @public
 */
export type SfEncodeOptions = {
	/**
	 * Include the single space that RFC 8941 serialization emits after each
	 * comma separating dictionary or list members.
	 *
	 * @defaultValue `true`
	 */
	whitespace?: boolean;
};
