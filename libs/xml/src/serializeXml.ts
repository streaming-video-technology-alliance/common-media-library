import type { XmlNode } from './XmlNode.ts'

/**
 * Basic xml encoding utility. Encodes XML into a string.
 *
 * @param xml - The XML node to encode
 * @returns The parsed XML
 *
 * @public
 *
 * @example
 * {@includeCode ../test/serializeXml.test.ts#example}
 */
export function serializeXml(xml: XmlNode): string {
	const { nodeName, attributes, childNodes } = xml

	if (nodeName === '#document') {
		return `<?xml version="1.0" encoding="UTF-8"?>${serializeXml(childNodes[0])}`
	}

	if (nodeName === '#text') {
		return xml.nodeValue || ''
	}

	let result = `<${nodeName}`

	if (attributes) {
		for (const key in attributes) {
			result += ` ${key}=${JSON.stringify(attributes[key])}`
		}
	}

	let children = ''

	const childCount = childNodes?.length

	if (childCount) {
		for (let i = 0; i < childCount; i++) {
			children += serializeXml(childNodes[i])
		}
	}

	const close = (!children) ? ' />' : `>${children}</${nodeName}>`
	result += close

	return result
}
