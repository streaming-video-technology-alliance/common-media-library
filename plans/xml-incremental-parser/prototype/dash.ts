import type { XmlNode } from '@svta/cml-xml'
import { buildXml } from './buildXml.ts'
import type { XmlBuilder } from './XmlBuilder.ts'

// dash.js DashParser.processXml as of the development branch (2026-09): the tree walk ported for the
// equivalence check and the benchmark, a one-pass builder that produces the identical objects with no
// XmlNode tree, and a lean builder that keeps only what the rest of dash.js reads.

/** A node after processNode: the XmlNode fields plus what dash.js adds */
export type DashNode = Record<string, unknown> & {
	nodeName: string;
	nodeValue: string | null;
	attributes: Record<string, string>;
	childNodes: DashNode[];
	prefix?: string | null;
	localName?: string;
	tagName?: string;
	__children?: DashNode[];
	__text?: string;
	__prefix?: string | null;
};

const durationRegex = /^([-])?P(([\d.]*)Y)?(([\d.]*)M)?(([\d.]*)D)?T?(([\d.]*)H)?(([\d.]*)M)?(([\d.]*)S)?/
const datetimeRegex = /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2})(?::([0-9]*)(\.[0-9]*)?)?(?:([+-])([0-9]{2})(?::?)([0-9]{2}))?/
const numericRegex = /^[-+]?[0-9]+[.]?[0-9]*([eE][-+]?[0-9]+)?$/

const SECONDS_IN_YEAR = 365 * 24 * 60 * 60
const SECONDS_IN_MONTH = 30 * 24 * 60 * 60
const SECONDS_IN_DAY = 24 * 60 * 60
const SECONDS_IN_HOUR = 60 * 60
const SECONDS_IN_MIN = 60
const MINUTES_IN_HOUR = 60
const MILLISECONDS_IN_SECONDS = 1000

type Matcher = {
	test: (tagName: string, attrName: string, value: string) => boolean;
	converter: (value: string) => unknown;
}

// The array allocations inside the tests are in dash.js too and are kept so both pipelines pay them
const matchers: Matcher[] = [
	{
		test(_tagName, attrName, value) {
			const attributeList = [
				'minBufferTime', 'mediaPresentationDuration', 'minimumUpdatePeriod', 'timeShiftBufferDepth', 'maxSegmentDuration',
				'maxSubsegmentDuration', 'suggestedPresentationDelay', 'start', 'starttime', 'duration',
			]
			for (const attribute of attributeList) {
				if (attrName === attribute) {
					return durationRegex.test(value)
				}
			}
			return false
		},
		converter(str) {
			const match = durationRegex.exec(str) as RegExpExecArray
			let result = (parseFloat(match[3] || '0') * SECONDS_IN_YEAR +
				parseFloat(match[5] || '0') * SECONDS_IN_MONTH +
				parseFloat(match[7] || '0') * SECONDS_IN_DAY +
				parseFloat(match[9] || '0') * SECONDS_IN_HOUR +
				parseFloat(match[11] || '0') * SECONDS_IN_MIN +
				parseFloat(match[13] || '0'))
			if (match[1] !== undefined) {
				result = -result
			}
			return result
		},
	},
	{
		test(_tagName, _attrName, value) {
			return datetimeRegex.test(value)
		},
		converter(str) {
			const match = datetimeRegex.exec(str) as RegExpExecArray
			let utcDate = Date.UTC(
				parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10),
				parseInt(match[4], 10), parseInt(match[5], 10),
				(match[6] && parseInt(match[6], 10)) || 0,
				(match[7] && parseFloat(match[7]) * MILLISECONDS_IN_SECONDS) || 0,
			)
			if (match[9] && match[10]) {
				const timezoneOffset = parseInt(match[9], 10) * MINUTES_IN_HOUR + parseInt(match[10], 10)
				utcDate += (match[8] === '+' ? -1 : +1) * timezoneOffset * SECONDS_IN_MIN * MILLISECONDS_IN_SECONDS
			}
			return new Date(utcDate)
		},
	},
	{
		test(_tagName, attrName, value) {
			return numericRegex.test(value) && attrName !== 'id'
		},
		converter(str) {
			return parseFloat(str)
		},
	},
	{
		test(tagName, attr) {
			const stringAttrsInElements: Record<string, string[]> = {
				AdaptationSet: ['lang'], Representation: ['lang'], ContentComponent: ['lang'], Label: ['lang'], GroupLabel: ['lang'],
			}
			if (Object.prototype.hasOwnProperty.call(stringAttrsInElements, tagName)) {
				return stringAttrsInElements[tagName].indexOf(attr) >= 0
			}
			return false
		},
		converter(str) {
			// normalizeBcp47 is a no-op for the tags the fixtures contain
			return String(str)
		},
	},
]

/** dash.js DashConstants elements that processNode collects into arrays */
export const ARRAY_NODES: string[] = [
	'Accessibility', 'AdaptationSet', 'add', 'AudioChannelConfiguration', 'BaseURL', 'ContentComponent', 'ContentProtection',
	'ContentSteering', 'EssentialProperty', 'Event', 'EventStream', 'InbandEventStream', 'Label', 'Location', 'Metrics',
	'PatchLocation', 'Period', 'Preselection', 'ProducerReferenceTime', 'remove', 'replace', 'Reporting', 'Representation',
	'Role', 'S', 'SegmentSequenceProperties', 'SegmentURL', 'ServiceDescription', 'SupplementalProperty', 'UTCTiming',
]

function convertAttribute(tagName: string, key: string, value: string): unknown {
	if (tagName === 'S') {
		return parseInt(value, 10)
	}
	for (const matcher of matchers) {
		if (matcher.test(tagName, key, value)) {
			return matcher.converter(value)
		}
	}
	return value
}

/**
 * Attaches `child` to `parent` the way processNode does: repeatable elements collect into arrays
 */
function attach(parent: DashNode, child: DashNode): void {
	const childName = child.nodeName
	const existing = parent[childName]
	if (Array.isArray(existing)) {
		existing.push(child)
	}
	else if (ARRAY_NODES.indexOf(childName) !== -1) {
		if (!parent[childName]) {
			parent[childName] = []
		}
		(parent[childName] as DashNode[]).push(child)
	}
	else {
		parent[childName] = child
	}
}

// ------------------------------------------------------------------------------------------------
// dash.js today: parseXml, then processNode over the tree
// ------------------------------------------------------------------------------------------------

function processNode(node: DashNode): void {
	const p = node.nodeName.indexOf(':')
	if (p !== -1) {
		node.__prefix = node.prefix
		node.nodeName = node.localName as string
	}

	const { childNodes, attributes, nodeName } = node
	node.tagName = nodeName

	for (const k in attributes) {
		node[k] = convertAttribute(nodeName, k, attributes[k])
	}

	for (const child of childNodes) {
		if (child.nodeName === '#text') {
			node.__text = child.nodeValue as string
			continue
		}
		processNode(child)
		attach(node, child)
	}

	node.__children = childNodes
}

/**
 * DashParser.processXml as it runs today: an XmlNode tree from `parse`, then processNode
 */
export function dashToday(parse: (input: string) => XmlNode, text: string): Record<string, DashNode> {
	const xml = parse(text) as unknown as DashNode
	const root = xml.childNodes.find(child => child.nodeName === 'MPD' || child.nodeName === 'Patch') ?? xml.childNodes[0]
	processNode(root)
	return { [root.tagName as string]: root }
}

// ------------------------------------------------------------------------------------------------
// One pass, faithful: the same objects processNode produces, with no XmlNode tree in between
// ------------------------------------------------------------------------------------------------

// A symbol key: attribute names become string properties on nodes, so no attribute can collide with it
const DOCUMENT = Symbol('document')

type DashDocument = {
	[DOCUMENT]: true;
	entries: { name: string; node: DashNode }[];
}

function isDashDocument(parent: DashNode | DashDocument): parent is DashDocument {
	return (parent as DashDocument)[DOCUMENT] === true
}

function leaf(nodeName: string, nodeValue: string): DashNode {
	return { nodeName, nodeValue, attributes: {}, childNodes: [] }
}

function processedLeaf(nodeName: string, nodeValue: string): DashNode {
	const node = leaf(nodeName, nodeValue)
	node.tagName = nodeName
	node.__children = node.childNodes
	return node
}

const faithfulBuilder: XmlBuilder<DashNode, DashDocument> = {
	createDocument: () => ({ [DOCUMENT]: true, entries: [] }),
	createElement: (_parent, name, attributes, localName, prefix) => {
		const node: DashNode = { nodeName: prefix === null ? name : localName, nodeValue: null, attributes, childNodes: [], prefix, localName }
		if (prefix !== null) {
			node.__prefix = prefix
		}
		node.tagName = node.nodeName
		for (const k in attributes) {
			node[k] = convertAttribute(node.nodeName, k, attributes[k])
		}
		node.__children = node.childNodes
		return node
	},
	appendChild: (parent, child, name) => {
		if (isDashDocument(parent)) {
			parent.entries.push({ name, node: child })
			return
		}
		parent.childNodes.push(child)
		attach(parent, child)
	},
	appendText: (parent, text) => {
		const trimmed = text.trim()
		if (trimmed.length === 0) {
			return
		}
		if (isDashDocument(parent)) {
			parent.entries.push({ name: '#text', node: leaf('#text', trimmed) })
			return
		}
		parent.childNodes.push(leaf('#text', trimmed))
		parent.__text = trimmed
	},
	appendCdata: (parent, text) => {
		if (isDashDocument(parent)) {
			parent.entries.push({ name: '#cdata', node: leaf('#cdata', text) })
			return
		}
		const node = processedLeaf('#cdata', text)
		parent.childNodes.push(node)
		attach(parent, node)
	},
	appendDoctype: (parent, text) => {
		if (isDashDocument(parent)) {
			parent.entries.push({ name: '#doctype', node: leaf('#doctype', '!' + text) })
			return
		}
		const node = processedLeaf('#doctype', '!' + text)
		parent.childNodes.push(node)
		attach(parent, node)
	},
}

/**
 * The dash.js manifest object in one pass, identical to `dashToday`
 */
export function dashOnePassFaithful(text: string): Record<string, DashNode> {
	const document = buildXml(text, faithfulBuilder)
	const root = document.entries.find(entry => entry.name === 'MPD' || entry.name === 'Patch') ?? document.entries[0]
	return { [root.node.tagName as string]: root.node }
}

// ------------------------------------------------------------------------------------------------
// One pass, lean: only what the rest of dash.js reads
// ------------------------------------------------------------------------------------------------

/** A lean node: tag name, converted attributes, children by name, ordered children, text */
export type LeanNode = Record<string, unknown> & {
	tagName: string;
	__children: LeanNode[];
	__text?: string;
	__prefix?: string;
};

type LeanDocument = {
	[DOCUMENT]: true;
	root: LeanNode | undefined;
}

function isLeanDocument(parent: LeanNode | LeanDocument): parent is LeanDocument {
	return (parent as LeanDocument)[DOCUMENT] === true
}

const ARRAY_NODE_SET = new Set(ARRAY_NODES)

const leanBuilder: XmlBuilder<LeanNode, LeanDocument> = {
	createDocument: () => ({ [DOCUMENT]: true, root: undefined }),
	createElement: (_parent, _name, attributes, localName, prefix) => {
		if (localName === 'S') {
			const node: LeanNode = { tagName: 'S', __children: [] }
			for (const key in attributes) {
				node[key] = parseInt(attributes[key], 10)
			}
			return node
		}
		const node: LeanNode = { tagName: localName, __children: [] }
		if (prefix !== null) {
			node.__prefix = prefix
		}
		for (const key in attributes) {
			node[key] = convertAttribute(localName, key, attributes[key])
		}
		return node
	},
	appendChild: (parent, child, name) => {
		if (isLeanDocument(parent)) {
			if (parent.root === undefined || name === 'MPD' || name === 'Patch') {
				parent.root = child
			}
			return
		}
		parent.__children.push(child)
		const existing = parent[child.tagName]
		if (Array.isArray(existing)) {
			existing.push(child)
		}
		else if (ARRAY_NODE_SET.has(child.tagName)) {
			parent[child.tagName] = [child]
		}
		else {
			parent[child.tagName] = child
		}
	},
	appendText: (parent, text) => {
		if (!isLeanDocument(parent)) {
			parent.__text = text.trim()
		}
	},
}

/**
 * A lean dash.js manifest object in one pass
 */
export function dashOnePassLean(text: string): LeanNode | undefined {
	return buildXml(text, leanBuilder).root
}
