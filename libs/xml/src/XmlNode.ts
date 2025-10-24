
/**
 * XML node
 *
 *
 * @beta
 */
export type XmlNode = {
	nodeName: string;
	nodeValue: string | null;
	attributes: Record<string, string>;
	childNodes: XmlNode[];
	prefix?: string | null;
	localName?: string;
};
