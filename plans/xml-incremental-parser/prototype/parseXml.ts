import type { XmlNode, XmlParseOptions } from '@svta/cml-xml'
import { scan } from './scan.ts'
import type { XmlBuilder } from './XmlBuilder.ts'

// parseXml on the phase-one scanner: the tree builder trims text, wraps comments and doctypes back into
// the XmlNode shapes, and runs the scanner in tolerant mode. Everything else is libs/xml/src/parseXml.ts.

const HASH_CC = 35 // '#'

function parentElementOf(parent: XmlNode): XmlNode | null {
	return parent.nodeName.charCodeAt(0) === HASH_CC ? null : parent
}

/**
 * Creates a builder that produces the `XmlNode` tree for the given options
 */
export function createTreeBuilder(keepWhitespace: boolean, keepComments: boolean, includeParentElement: boolean): XmlBuilder<XmlNode> {
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
		appendText: keepWhitespace
			? (parent, text) => appendLeaf(parent, '#text', text)
			: (parent, text) => {
				const trimmed = text.trim()
				if (trimmed.length > 0) {
					appendLeaf(parent, '#text', trimmed)
				}
			},
		appendCdata: (parent, text) => appendLeaf(parent, '#cdata', text),
		appendComment: keepComments ? (parent, text) => appendLeaf(parent, '#comment', '<!--' + text + '-->') : undefined,
		appendDoctype: (parent, text) => appendLeaf(parent, '#doctype', '!' + text),
	}
}

// One builder per combination of keepWhitespace (bit 0), keepComments (bit 1), and includeParentElement (bit 2)
const TREE_BUILDERS: XmlBuilder<XmlNode>[] = []
for (let bits = 0; bits < 8; bits++) {
	TREE_BUILDERS.push(createTreeBuilder((bits & 1) !== 0, (bits & 2) !== 0, (bits & 4) !== 0))
}

/**
 * parseXml with the same signature and tolerance as the published function, on the phase-one scanner
 */
export function parseXml(input: string, options: XmlParseOptions = {}): XmlNode {
	const builder = TREE_BUILDERS[(options.keepWhitespace ? 1 : 0) | (options.keepComments ? 2 : 0) | (options.includeParentElement ? 4 : 0)]
	const document = (builder.createDocument as () => XmlNode)()

	scan(input, options.pos || 0, !!options.keepWhitespace, false, builder, [document], [''])

	return document
}
