/**
 * Options for `buildXml`.
 */
export type XmlBuildOptions<TDocument> = {
	/** The document value to build into. When absent, `builder.createDocument()` supplies it. */
	root?: TDocument;
	/** Deliver whitespace-only text runs too (default false). Text is never trimmed by the scanner. */
	keepWhitespace?: boolean;
};
