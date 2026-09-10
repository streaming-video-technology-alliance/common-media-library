import { scan } from './scan.ts'
import type { XmlBuilder } from './XmlBuilder.ts'
import type { XmlParseWithOptions } from './XmlParseWithOptions.ts'

/**
 * Parses `input` in one pass and returns whatever `builder` produced for the document. The input must be
 * a complete document: an element left open or a construct cut off by the end of the input throws an
 * `XmlParseError`, as does every error `parseXml` reports.
 *
 * @param input - The whole XML document
 * @param builder - The callbacks that create the result
 * @param options - The root value and whitespace handling
 * @returns The document value, either `options.root` or the result of `builder.createDocument()`
 */
export function parseXmlWith<TElement, TDocument = TElement>(input: string, builder: XmlBuilder<TElement, TDocument>, options: XmlParseWithOptions<TDocument> = {}): TDocument {
	const root = options.root !== undefined ? options.root : builder.createDocument?.()
	if (root === undefined) {
		throw new TypeError('parseXmlWith: provide options.root or builder.createDocument')
	}

	scan(input, 0, !!options.keepWhitespace, true, builder, [root], [''])

	return root
}
