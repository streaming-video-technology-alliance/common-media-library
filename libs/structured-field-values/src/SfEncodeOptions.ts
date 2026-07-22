/**
 * Options for encoding a structured field.
 *
 * @public
 */
export type SfEncodeOptions = {
	/**
	 * Include whitespace in the output.
	 */
	whitespace?: boolean;

	/**
	 * Omit dictionary and list members that fail RFC 8941 serialization
	 * (for example strings containing control characters, integers outside
	 * ±999,999,999,999,999, or tokens with invalid characters) and emit the
	 * remaining members as a valid structured field.
	 *
	 * Defaults to `false`: any unserializable member fails the entire
	 * serialization, per the RFC.
	 */
	skipUnserializable?: boolean;
};
