import type { XmlNode } from './XmlNode.ts'
import type { XmlParseOptions } from './XmlParseOptions.ts'
import { scan, type XmlBuilder } from './scan.ts'

const HASH_CC = 35 // '#'

/**
 * The parent element of a node whose parent is `parent`: null when the parent is the document
 */
function parentElementOf(parent: XmlNode): XmlNode | null {
	return parent.nodeName.charCodeAt(0) === HASH_CC ? null : parent
}

/**
 * Creates a builder that produces the `XmlNode` tree
 */
function createTreeBuilder(keepComments: boolean, includeParentElement: boolean): XmlBuilder<XmlNode> {
	const createLeaf = includeParentElement
		? (parent: XmlNode, nodeName: string, nodeValue: string): XmlNode => ({ nodeName, nodeValue, attributes: {}, childNodes: [], parentElement: parentElementOf(parent) })
		: (_parent: XmlNode, nodeName: string, nodeValue: string): XmlNode => ({ nodeName, nodeValue, attributes: {}, childNodes: [] })

	const appendLeaf = (parent: XmlNode, nodeName: string, nodeValue: string): void => {
		parent.childNodes.push(createLeaf(parent, nodeName, nodeValue))
	}

	return {
		createDocument: includeParentElement
			? (): XmlNode => ({ nodeName: '#document', nodeValue: null, childNodes: [], attributes: {}, parentElement: null })
			: (): XmlNode => ({ nodeName: '#document', nodeValue: null, childNodes: [], attributes: {} }),
		createElement: includeParentElement
			? (parent, nodeName, attributes, localName, prefix): XmlNode => ({ nodeName, nodeValue: null, attributes, childNodes: [], prefix, localName, parentElement: parentElementOf(parent) })
			: (_parent, nodeName, attributes, localName, prefix): XmlNode => ({ nodeName, nodeValue: null, attributes, childNodes: [], prefix, localName }),
		appendChild: (parent, child) => {
			parent.childNodes.push(child)
		},
		appendText: (parent, text) => appendLeaf(parent, '#text', text),
		appendCdata: (parent, text) => appendLeaf(parent, '#cdata', text),
		appendComment: keepComments ? (parent, text) => appendLeaf(parent, '#comment', text) : undefined,
		appendDoctype: (parent, text) => appendLeaf(parent, '#doctype', text),
	}
}

// One builder per combination of keepComments (bit 0) and includeParentElement (bit 1)
const TREE_BUILDERS: XmlBuilder<XmlNode>[] = [
	/* @__PURE__ */ createTreeBuilder(false, false),
	/* @__PURE__ */ createTreeBuilder(true, false),
	/* @__PURE__ */ createTreeBuilder(false, true),
	/* @__PURE__ */ createTreeBuilder(true, true),
]

/**
 * Parse XML into a JS object
 *
 * The parser does not validate against a DTD or schema, and it does not check every
 * well-formedness constraint; the errors it does report are listed below under Throws.
 * Input cut off between tags yields the nodes parsed so far.
 *
 * @param input - The input XML string
 * @param options - Optional parsing options
 * @returns The parsed XML
 * @throws If an attribute is not `name="value"` or `name='value'`, if a quoted value is not closed, if a close tag does not match its open tag, or if a close tag appears with no element open
 *
 * @public
 *
 * @example
 * {@includeCode ../test/parseXml.test.ts#example}
 */
export function parseXml(input: string, options: XmlParseOptions = {}): XmlNode {
	const builder = TREE_BUILDERS[(options.keepComments ? 1 : 0) | (options.includeParentElement ? 2 : 0)]
	const document = builder.createDocument()

	scan(input, options.pos || 0, !!options.keepWhitespace, builder, [document], [''])

	return document
}
